<template>
    <div class="d-flex flex-column">
        <header class="title-header space-below d-flex justify-content-between align-items-center mb-2">
            <slot name="title">
            </slot>

            <div class="toolbar d-flex gap-1 align-items-center">
                <button
                    class="btn btn-sm btn-outline-success border-0"
                    :title="t('tree.new_top_concept')"
                    @click.prevent="onAddTopConcept()"
                >
                    <i class="fa-solid fa-plus"></i>
                </button>
                <div
                    class="px-2 clickable"
                    data-bs-toggle="dropdown"
                >
                    <i class="fa-solid fa-ellipsis-vertical"></i>
                </div>

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
                    @input-file="inputFile"
                >
                </file-upload>

                <div
                    class="dropdown-menu user-select-none"
                    :aria-labelledby="`import-tree-btn-dropdown-${treeName}`"
                >
                    <a
                        class="dropdown-item"
                        href="#"
                        @click.prevent="toggleSandbox()"
                    >
                        {{ t('tree.sandbox.toggle') }}
                    </a>
                    <hr class="dropdown-divider">
                    <a
                        class="dropdown-item"
                        href="#"
                        @click.prevent="triggerFileUpload('extend')"
                    >
                        {{ t('tree.import.extend') }}
                    </a>
                    <a
                        class="dropdown-item"
                        href="#"
                        @click.prevent="triggerFileUpload('update_extend')"
                    >
                        {{ t('tree.import.update_extend') }}
                    </a>
                    <a
                        class="dropdown-item"
                        href="#"
                        @click.prevent="triggerFileUpload('replace')"
                    >
                        {{ t('tree.import.replace') }}
                    </a>
                    <template v-if="can('thesaurus_share')">
                        <div class="dropdown-divider"></div>
                        <a
                            class="dropdown-item"
                            href="#"
                            @click.prevent="onExport()"
                        >
                            {{ t('tree.export.label') }}
                        </a>
                    </template>
                </div>
            </div>
        </header>
        <ConceptSearch
            class="my-2 mb-3"
            :tree-name="treeName"
        />
        <div class="d-flex flex-column px-0 scroll-y-auto scroll-x-auto flex-fill">
            <tree
                v-if="treeData.length > 0"
                :id="state.treeId"
                :preid="treeName"
                :data="treeData"
                :draggable="state.dragAllowed"
                :drag-target="dragTarget"
                :drop-allowed="dropAllowed"
                size="small"
                @change="itemClick"
                @drop="itemDrop"
                @toggle="itemToggle"
                @change-drag-target="changeDragTarget"
            >
            </tree>
            <div
                v-else
                class="h-100 w-100 d-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-3 border-dashed border-2 border-secondary mt-2"
            >
                <div class="text-center px-5">
                    <h4>
                        {{ t('tree.is_empty') }}
                    </h4>
                    <span v-html="t('tree.empty_info')" />
                </div>
            </div>
        </div>
        <div
            class="position-absolute top-0 start-0 h-100 w-100 bg-light bg-opacity-50"
            style="z-index: 9999;"
            v-show="state.isUploading"
        >
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
        reactive,
        ref,
    } from 'vue';

    import { useI18n } from 'vue-i18n';
    import {
        getNodeFromPath,
    } from 'tree-component';

    import {
        uploadConceptsFile,
    } from '@/helpers/tree.js';

    import {
        showCreateConcept,
    } from '@/helpers/modal.js';

    import {
        can,
    } from '@/helpers/helpers.js';

    import router from '@/bootstrap/router.js';
    import useConceptStore from '@/bootstrap/stores/concept.js';
import { useRoute } from 'vue-router';

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
            }
        },
        emits: ['change-drag-target', 'toggle-sandbox'],
        setup(props, context) {
            const { t } = useI18n();
            const conceptStore = useConceptStore();
            
            // FUNCTIONS
            const itemClick = item => {
                const nid = item?.data?.nid || null;
                const tree = item?.data?.tree || null;

                if(nid == null || tree == null) {
                    return;
                }

                if(conceptStore.isSelected(nid, tree)) {
                    conceptStore.setSelected(null)
                    pushRoute(null, null);
                } else {
                    const nid = item.data.nid;
                    conceptStore.setSelected(nid, props.treeName);
                    pushRoute(nid);
                }
            }

            const currentRoute = useRoute();
            const pushRoute = (id) => {
                if(props.treeName != null && id) {
                    router.push({
                        name: 'conceptdetail',
                        params: {
                            id: id,
                        },
                        query: {
                            ...currentRoute.query,
                            t: props.treeName,
                        }
                    });
                } else {
                    router.push({
                        append: true,
                        name: 'home',
                    });
                }
            }

            const itemToggle = async eventData => {
                const node = eventData.data;
                await node.toggle();
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
                    parentNode = getNodeFromPath(conceptStore.selected[props.treeName], eventData.targetPath.slice(0, eventData.targetPath.length - 1));
                }
                const nid = srcNode.nid;
                const bid = parentNode ? parentNode.nid : -1;

                const isFromOtherTree = srcNode.tree != tgtNode.tree;

                if(isFromOtherTree) {
                    conceptStore.clone(nid, bid, srcNode.tree, tgtNode.tree);
                } else {
                    conceptStore.addRelation(nid, bid, srcNode.tree);
                }

                return;
            };
            const changeDragTarget = dragTargetData => {
                context.emit('change-drag-target', dragTargetData);
            };
            const toggleSandbox = _ => {
                context.emit('toggle-sandbox');
            }
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
                return uploadConceptsFile(file.file, props.treeName, state.uploadType).then(_ => {
                    state.uploadType = '';
                    state.isUploading = false;
                }).catch(e => {
                    state.uploadType = '';
                    state.isUploading = false;
                    console.error("error occurred", e);
                });
            };
            const onExport = _ => {
                conceptStore.export(props.treeName);
            };
            const onAddTopConcept = _ => {
                if(!can('thesaurus_write')) return;
                showCreateConcept(props.treeName);
            };
            const dropAllowed = dropData => {
                if(!can('thesaurus_write')) return false;

                const srcNode = dropData.sourceData;
                const tgtNode = dropData.targetData;

                let parentNode;
                if(tgtNode.state.dropPosition == DropPosition.inside) {
                    parentNode = tgtNode;
                } else {
                    parentNode = getNodeFromPath(conceptStore.tree[props.treeName], dropData.targetPath.slice(0, dropData.targetPath.length - 1));
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
                        for(let i = 0; i < dropData.sourcePath.length; i++) {
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
                    const srcParentNode = getNodeFromPath(conceptStore.tree[props.treeName], dropData.sourcePath.slice(0, dropData.sourcePath.length - 1));
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
                treeId: computed(_ => `concept-tree-${props.treeName}`),
                concept: computed(_ => conceptStore.selected),
                conceptSelected: computed(_ => state.concept.from != null && Object.keys(state.concept.data || {}).length > 0),
                isFromTree: computed(_ => state.conceptSelected && state.concept.from == props.treeName),
                dragAllowed: computed(_ => true),
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
                toggleSandbox,
                triggerFileUpload,
                inputFile,
                importFile,
                onExport,
                onAddTopConcept,
                dropAllowed,
                // STATE
                uploadRef,
                state,
            };
        }
    }
</script>
