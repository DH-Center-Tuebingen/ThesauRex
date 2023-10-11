<template>
    <div class="d-flex flex-column">
        <div class="d-flex flex-row justify-content-start gap-2">
            <file-upload
                class="d-none"
                accept="application/rdf+xml,application/xml"
                extensions="xml,rdf"
                v-model="state.files"
                :ref="el => uploadRef = el"
                :custom-action="importFile"
                :directory="false"
                :disabled="!can('thesaurus_write|thesaurus_create')"
                :multiple="false"
                :drop="true"
                @input-file="inputFile">
            </file-upload>
            <div class="btn-group" role="group" aria-label="Button group with nested dropdown">
                <button type="button" class="btn btn-outline-secondary" @click.prevent="triggerFileUpload('extend')">
                    {{ t('tree.import.label') }}
                </button>
                <div class="btn-group" role="group">
                    <button :id="`import-tree-btn-dropdown-${treeName}`" type="button" class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false"></button>
                    <div class="dropdown-menu" :aria-labelledby="`import-tree-btn-dropdown-${treeName}`">
                        <a class="dropdown-item" href="#" @click.prevent="triggerFileUpload('extend')">
                            <i class="fas fa-fw fa-"></i>
                            {{ t('tree.import.extend') }}
                        </a>
                        <a class="dropdown-item" href="#" @click.prevent="triggerFileUpload('update_extend')">
                            <i class="fas fa-fw fa-"></i>
                            {{ t('tree.import.update_extend') }}
                        </a>
                        <a class="dropdown-item" href="#" @click.prevent="triggerFileUpload('replace')">
                            <i class="fas fa-fw fa-"></i>
                            {{ t('tree.import.replace') }}
                        </a>
                    </div>
                </div>
            </div>
            <button type="button" class="btn btn-outline-secondary" @click="onExport()" v-if="can('thesaurus_share')">
                {{ t('tree.export.label') }}
            </button>
        </div>
        <tree-search
            class="my-2"
            :on-multiselect="onSearchMultiSelect"
            :on-clear="resetHighlighting"
            :tree-name="treeName">
        </tree-search>
        <a href="" class="text-secondary" @click.prevent="onAddTopConcept()" v-if="can('thesaurus_write')">
            {{ t('tree.new_top_concept') }}
        </a>
        <div class="d-flex flex-column col px-0 scroll-y-auto">
            <tree
                v-if="treeData.length > 0"
                :id="state.treeId"
                :data="treeData"
                :draggable="state.dragAllowed"
                :drag-target="dragTarget"
                :drop-allowed="dropAllowed"
                size="small"
                @change="itemClick"
                @drop="itemDrop"
                @toggle="itemToggle"
                @change-drag-target="changeDragTarget">
            </tree>
            <div class="h-100 w-100 d-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-3 border-dashed border-2 border-secondary mt-2" v-else>
                <div class="text-center px-5">
                    <h4>
                        {{ t('tree.is_empty') }}
                    </h4>
                    <span v-html="t('tree.empty_info')"/>
                </div>
            </div>
        </div>
        <div class="position-absolute top-0 start-0 h-100 w-100 bg-light bg-opacity-50" style="z-index: 9999;" v-show="state.isUploading">
            <div class="h-100 w-100 d-flex flex-column align-items-center justify-content-center">
                <h1>
                    {{ t('modals.import_info.title') }}
                </h1>
                <h3>
                    {{ t('modals.import_info.info') }}
                </h3>
                <span class="mt-5">
                    <i class="fas fa-3x fa-sync-alt fa-spin"></i>
                </span>
            </div>
        </div>
    </div>
</template>

<script>
    import {
        computed,
        onMounted,
        onUnmounted,
        reactive,
        ref,
        toRefs,
    } from 'vue';

    import { useRoute } from 'vue-router';
    import { useI18n } from 'vue-i18n';
    import {
        getNodeFromPath,
    } from 'tree-component';

    import {
        exportTree,
        toggleTreeNode,
        uploadConceptsFile,
    } from '@/helpers/tree.js';

    import {
        addRelation,
        cloneAcrossTree,
    } from '@/api.js';

    import {
        showCreateConcept,
    } from '@/helpers/modal.js';

    import {
        can,
    } from '@/helpers/helpers.js';

    import router from '@/bootstrap/router.js';
    import store from '@/bootstrap/store.js';

    import ConceptSearch from '@/components/tree/Search.vue';

    const DropPosition = {
        empty: 0,
        up: 1,
        inside: 2,
        down: 3,
    };

    export default {
        props: {
            dragTarget: {
                required: false,
                type: Object
            },
            treeData: {
                required: true,
                type: Array
            },
            treeName: {
                required: true,
                type: String
            },
            dragDelay: {
                required: false,
                type: Number,
                default: 500
            }
        },
        components: {
            'tree-search': ConceptSearch,
        },
        emits: ['change-drag-target'],
        setup(props, context) {
            const { t } = useI18n();
            const currentRoute = useRoute();
            const {
                dragTarget,
                treeData,
                treeName,
                dragDelay,
            } = toRefs(props);

            // FETCH

            // FUNCTIONS
            const itemClick = (item) => {
                if(state.isFromTree && state.concept.data.id == item.data.id) {
                    router.push({
                        append: true,
                        name: 'home',
                    });
                } else {
                    router.push({
                        name: 'conceptdetail',
                        params: {
                            id: item.data.nid
                        },
                        query: {
                            ...currentRoute.query,
                            t: treeName.value,
                        }
                    });
                }
            };
            const itemToggle = eventData => {
                toggleTreeNode(eventData.data, treeName.value);
            };
            const itemDrop = eventData => {
                if(!dropAllowed(eventData)) {
                    return;
                }

                const srcNode = eventData.sourceData;
                const tgtNode = eventData.targetData;

                let parentNode;
                if(tgtNode.state.dropPosition == DropPosition.inside) {
                    parentNode = tgtNode;
                } else {
                    parentNode = getNodeFromPath(store.getters.conceptsFromTree(treeName.value), eventData.targetPath.slice(0, eventData.targetPath.length-1));
                }
                const nid = srcNode.nid;
                const bid = parentNode ? parentNode.nid : -1;

                const isFromOtherTree = srcNode.tree != tgtNode.tree;

                if(isFromOtherTree) {
                    cloneAcrossTree(nid, bid, srcNode.tree, tgtNode.tree);
                } else {
                    addRelation(nid, bid, srcNode.tree);
                }

                return;
            };
            const changeDragTarget = dragTargetData => {
                context.emit('change-drag-target', dragTargetData);
            };
            const triggerFileUpload = type => {
                state.uploadType = type;
                uploadRef.value.$el.children.file.click();
            };
            const inputFile = (newFile, oldFile) => {
                if(!can('thesaurus_write|thesaurus_create')) return;

                // Enable automatic upload
                if(!!newFile && (Boolean(newFile) !== Boolean(oldFile) || oldFile.error !== newFile.error)) {
                    if(!newFile.active) {
                        newFile.active = true
                    }
                }
            };
            const importFile = (file, component) => {
                state.isUploading = true;
                if(state.isFromTree) {
                    router.push({
                        append: true,
                        name: 'home',
                    });
                }
                return uploadConceptsFile(file.file, treeName.value, state.uploadType).then(_ => {
                    state.uploadType = '';
                    state.isUploading = false;
                }).catch(e => {
                    console.log("error occurred", e);
                    state.uploadType = '';
                    state.isUploading = false;
                });
            };
            const onExport = _ => {
                exportTree();
            };
            const onAddTopConcept = _ => {
                if(!can('thesaurus_write')) return;
                showCreateConcept(treeName.value);
            };
            const dropAllowed = dropData => {
                if(!can('thesaurus_write')) return false;

                const srcNode = dropData.sourceData;
                const tgtNode = dropData.targetData;

                let parentNode;
                if(tgtNode.state.dropPosition == DropPosition.inside) {
                    parentNode = tgtNode;
                } else {
                    parentNode = getNodeFromPath(store.getters.conceptsFromTree(treeName.value), dropData.targetPath.slice(0, dropData.targetPath.length-1));
                }
                const nid = srcNode.nid;
                const isFromOtherTree = srcNode.treeName != tgtNode.treeName;

                // Cancel drop if from same tree and ...
                if(!isFromOtherTree) {
                    // ... target is same node or ...
                    if(nid == tgtNode.nid) return false;
                    // ... target parent is also parent of source ...
                    if(parentNode) {
                        const alreadyChild = parentNode.children.some(c => c.nid == nid);
                        if(alreadyChild) {
                            return false;
                        }
                    }
                    // ... source is a parent of target (would result in circle) or ...
                    if(dropData.targetPath.length > dropData.sourcePath.length) {
                        let srcIsParent = true;
                        for(let i=0; i<dropData.sourcePath.length; i++) {
                            const p = dropData.sourcePath[i];
                            const pt = dropData.targetPath[i];
                            if(p !== pt) {
                                srcIsParent = false;
                                break;
                            }
                        }
                        if(srcIsParent) return false;
                    }
                    // ... source is added on same level (as child of parent/target)
                    const srcParentNode = getNodeFromPath(store.getters.conceptsFromTree(treeName.value), dropData.sourcePath.slice(0, dropData.sourcePath.length-1));
                    console.log("same level", srcParentNode, dropData);
                    if((!parentNode && !srcParentNode) || (parentNode && srcParentNode && parentNode.id === srcParentNode.id)) {
                        return false;
                    }
                }
                // In any other cases allow drop
                return true;
            };

            // DATA
            const uploadRef = ref({});
            const state = reactive({
                highlightedItems: [],
                uploadType: '',
                isUploading: false,
                treeId: computed(_ => `concept-tree-${treeName.value}`),
                concept: computed(_ => store.getters.selectedConcept),
                conceptSelected: computed(_ => state.concept.from != null && Object.keys(state.concept.data || {}).length > 0),
                isFromTree: computed(_ => state.conceptSelected && state.concept.from == treeName.value),
                dragAllowed: computed(_ => true),
            });

            // ON MOUNTED
            onMounted(_ => {
                console.log("concept tree component mounted");
            });

            return {
                t,
                // HELPERS
                can,
                // LOCAL
                itemClick,
                itemToggle,
                itemDrop,
                changeDragTarget,
                triggerFileUpload,
                inputFile,
                importFile,
                onExport,
                onAddTopConcept,
                dropAllowed,
                // PROPS
                dragTarget,
                treeData,
                // STATE
                uploadRef,
                state,
            };
        }
        // methods: {
        //     changeDragTarget(e) {
        //         this.$emit('change-drag-target', e);
        //     },
        //     itemDrop(dropData) {
        //         if(!this.isDragAllowed || !this.isDropAllowed(dropData)) {
        //             return;
        //         }

        //         const srcNode = dropData.sourceData;
        //         const tgtNode = dropData.targetData;

        //         let parentNode;
        //         if(tgtNode.state.dropPosition == DropPosition.inside) {
        //             parentNode = tgtNode;
        //         } else {
        //             parentNode = treeUtility.getNodeFromPath(this.tree, dropData.targetPath.slice(0, dropData.targetPath.length-1));
        //         }
        //         const nid = srcNode.id;
        //         const bid = parentNode ? parentNode.id : -1;

        //         const isFromOtherTree = srcNode.treeName != tgtNode.treeName;

        //         if(isFromOtherTree) {
        //             const from = this.treeName === 'sandbox' ? '' : 'sandbox';
        //             $httpQueue.add(() => $http.put(`/tree/concept/clone/${nid}/to/${bid}?t=${this.treeName}&s=${from}`).then(response => {
        //                 this.eventBus.$emit(`concept-created-${this.treeName}`, {
        //                     parent_id: parentNode ? parentNode.id : undefined,
        //                     concept: response.data
        //                 });
        //             }));
        //         } else {
        //             $httpQueue.add(() => $http.put(`/tree/concept/${nid}/broader/${bid}?t=${this.treeName}`).then(response => {
        //                 this.eventBus.$emit(`relation-updated-${this.treeName}`, {
        //                     type: 'add',
        //                     concept: this.concepts[nid],
        //                     broader_id: bid,
        //                     narrower_id: nid
        //                 });
        //             }));
        //         }

        //         return;
        //     },
        //     triggerFileUpload(type) {
        //         this.importType = type;
        //         this.$refs.upload.$el.children.file.click();
        //     },
        //     importFile(newFile, oldFile) {
        //         // Wait for response
        //         if(newFile && oldFile && newFile.success && !oldFile.success) {
        //             this.filesUploaded++;
        //         }
        //         if(newFile && oldFile && newFile.error && !oldFile.error) {
        //             this.filesErrored++;
        //         }
        //         // Enable automatic upload
        //         if(Boolean(newFile) !== Boolean(oldFile) || oldFile.error !== newFile.error) {
        //             if(!this.$refs.upload.active) {
        //                 this.$refs.upload.active = true
        //             }
        //         }
        //         if(this.filesUploaded + this.filesErrored == this.uploadFiles.length) {
        //             if(this.filesUploaded > 0) {
        //                 this.filesUploaded = 0;
        //                 this.filesErrored = 0;
        //                 // TODO handle update
        //             }
        //         }
        //     },
        //     uploadFile(file, component) {
        //         this.$modal.show('importing-info-modal');
        //         let formData = new FormData();
        //         formData.append('file', file.file);
        //         formData.append('type', this.importType);
        //         return $http.post(`tree/file?t=${this.treeName}`, formData).then(res => {
        //             this.$modal.hide('importing-info-modal');
        //             return res;
        //         }).catch(error => {
        //             this.$modal.hide('importing-info-modal');
        //             return error;
        //         });
        //     },
        //     handleDeleteAll(e) {
        //         if(!this.$can('delete_move_concepts')) return;
        //         const id = e.element.id;
        //         $httpQueue.add(() => $http.delete(`/tree/concept/${id}?t=${this.treeName}`).then(response => {
        //             if(id == this.$route.params.id && this.treeName === this.$route.query.t) {
        //                 this.$router.push({
        //                     name: 'home'
        //                 });
        //             }
        //             // TODO handle update (sub-tree deleted)
        //             const path = document.getElementById(`tree-node-${id}`).parentElement.getAttribute('data-path').split(',');
        //             this.removeFromTree(e.element, path);
        //         }));
        //     },
        //     handleDeleteOneUp(e) {
        //         const el = e.element;
        //         const id = el.id;
        //         $httpQueue.add(() => $http.delete(`/tree/concept/${id}/move?t=${this.treeName}`).then(response => {
        //             // TODO handle update (concept deleted, descs one level up)
        //             let newParent;
        //             if(!el.parents.length) {
        //                 this.tree.children_count += el.children.length;
        //                 newParent = this.tree;
        //             } else {
        //                 const parent = el.parents[el.parents.length - 1];
        //                 const parentNode = this.concepts[parent.id];
        //                 parentNode.children_count += el.children.length;
        //                 newParent = parentNode.children;
        //             }
        //             el.children.forEach(c => {
        //                 c.parents.pop();
        //                 c.path.splice(c.path.length-2, 1);
        //                 newParent.push(c);
        //             });
        //             const path = document.getElementById(`tree-node-${id}`).parentElement.getAttribute('data-path').split(',');
        //             this.removeFromTree(el, path);
        //             this.sortTree(newParent);
        //             if(id == this.$route.params.id && this.treeName === this.$route.query.t) {
        //                 this.$router.push({
        //                     name: 'home'
        //                 });
        //             }
        //         }));
        //     },
        //     handleConceptRemoveRelation(e) {
        //         const parentNode = treeUtility.getNodeFromPath(this.tree, e.path.slice(0, e.path.length-1));
        //         const id = e.element.id;
        //         const bid = parentNode ? parentNode.id : -1;
        //         $httpQueue.add(() => $http.delete(`/tree/concept/${id}/broader/${bid}?t=${this.treeName}`).then(response => {
        //             this.eventBus.$emit(`relation-updated-${this.treeName}`, {
        //                 type: 'remove',
        //                 broader_id: bid != -1 ? bid : undefined,
        //                 narrower_id: id
        //             });
        //         }));
        //     },
        //     handleRelationUpdate(e) {
        //         let broader;
        //         let narrower;
        //         let siblings;
        //         switch(e.type) {
        //             case 'add':
        //                 broader = this.concepts[e.broader_id];
        //                 narrower = this.concepts[e.narrower_id];
        //                 if(e.broader_id && !broader.childrenLoaded) {
        //                     broader.children_count++;
        //                     break;
        //                 }
        //                 siblings = e.broader_id ? broader.children : this.tree;
        //                 siblings.push(narrower);
        //                 this.sortTree(siblings);
        //                 break;
        //             case 'remove':
        //                 broader = this.concepts[e.broader_id];
        //                 narrower = this.concepts[e.narrower_id];
        //                 if(e.broader_id && !broader.childrenLoaded) {
        //                     broader.children_count--;
        //                     break;
        //                 }
        //                 siblings = e.broader_id ? broader.children : this.tree;
        //                 const childIndex = siblings.findIndex(c => {
        //                     return c.id == narrower.id;
        //                 });
        //                 if(childIndex > -1) {
        //                     siblings.splice(childIndex, 1);
        //                 }
        //                 break;
        //         }
        //     },
        //     isDropAllowed(dropData) {
        //         const srcNode = dropData.sourceData;
        //         const tgtNode = dropData.targetData;

        //         let parentNode;
        //         if(tgtNode.state.dropPosition == DropPosition.inside) {
        //             parentNode = tgtNode;
        //         } else {
        //             parentNode = treeUtility.getNodeFromPath(this.tree, dropData.targetPath.slice(0, dropData.targetPath.length-1));
        //         }
        //         const nid = srcNode.id;
        //         const isFromOtherTree = srcNode.treeName != tgtNode.treeName;

        //         // Cancel drop if from same tree and ...
        //         if(!isFromOtherTree) {
        //             // ... target is same node or ...
        //             if(nid == tgtNode.id) return false;
        //             // ... source is a parent of target (would result in circle) or ...
        //             if(dropData.targetPath.length > dropData.sourcePath.length) {
        //                 let srcIsParent = true;
        //                 for(let i=0; i<dropData.sourcePath.length; i++) {
        //                     const p = dropData.sourcePath[i];
        //                     const pt = dropData.targetPath[i];
        //                     if(p !== pt) {
        //                         srcIsParent = false;
        //                         break;
        //                     }
        //                 }
        //                 if(srcIsParent) return false;
        //             }
        //             // ... source is added on same level (as child of parent/target)
        //             const srcParentNode = treeUtility.getNodeFromPath(this.tree, dropData.sourcePath.slice(0, dropData.sourcePath.length-1));
        //             if((!parentNode && !srcParentNode) || (parentNode && srcParentNode && parentNode.id === srcParentNode.id)) {
        //                 return false;
        //             }
        //         }
        //         // In any other cases allow drop
        //         return true;
        //     },
        //     onSearchMultiSelect(items) {
        //         this.resetHighlighting();
        //         this.highlightItems(items);
        //     },
        //     onSearchClear() {
        //         this.resetHighlighting();
        //     },
        //     highlightItems(items) {
        //         items.forEach(i => {
        //             return this.openPath(i.path).then(targetNode => {
        //                 targetNode.state.highlighted = true;
        //                 this.highlightedItems.push(targetNode);
        //             });
        //         });
        //     },
        //     resetHighlighting() {
        //         this.highlightedItems.forEach(i => i.state.highlighted = false);
        //         this.highlightedItems = [];
        //     },
        // },
        // data() {
        //     return {
        //         concepts: [],
        //         tree: [],
        //         highlightedItems: [],
        //         selectedConceptId: -1,
        //         uploadFiles: [],
        //         filesUploaded: 0,
        //         filesErrored: 0
        //     }
        // },
        // computed: {
        //     topLevelCount() {
        //         return this.tree.length || 0;
        //     },
        //     isDragAllowed() {
        //         return true;
        //     },
        //     scrollTo() {
        //         return {
        //             duration: 500,
        //             options: {
        //                 container: `#${this.treeId}`,
        //                 force: false,
        //                 cancelable: true,
        //                 x: false,
        //                 y: true
        //             }
        //         };
        //     }
        // }
    }
</script>
