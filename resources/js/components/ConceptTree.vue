<template>
    <div class="h-100 d-flex flex-column">
        <div class="d-flex flex-row justify-content-start">
            <div class="btn-group mr-2">
                <file-upload style="display: none;"
                    accept="application/rdf+xml,application/xml"
                    extensions="xml,rdf"
                    ref="upload"
                    v-model="uploadFiles"
                    :custom-action="uploadFile"
                    :directory="false"
                    :drop="false"
                    :multiple="false"
                    @input-file="importFile">
                </file-upload>
                <button type="button" class="btn btn-outline-secondary" @click="triggerFileUpload('extend')">
                    {{ $t('tree.import.label') }}
                </button>
                <button type="button" class="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="sr-only">Toggle Dropdown</span>
                </button>
                <div class="dropdown-menu">
                    <a class="dropdown-item" href="#" @click.prevent="triggerFileUpload('extend')">
                        {{ $t('tree.import.extend') }}
                    </a>
                    <a class="dropdown-item" href="#" @click.prevent="triggerFileUpload('update-extend')">
                        {{ $t('tree.import.update-extend') }}
                    </a>
                    <a class="dropdown-item" href="#" @click.prevent="triggerFileUpload('replace')">
                        {{ $t('tree.import.replace') }}
                    </a>
                </div>
            </div>
            <button type="button" class="btn btn-outline-secondary" @click="exportTree()">
                {{ $t('tree.export.label') }}
            </button>
        </div>
        <tree-search
            class="my-2"
            :on-multiselect="onSearchMultiSelect"
            :on-clear="resetHighlighting"
            :tree-name="treeName">
        </tree-search>
        <div class="d-flex flex-column col">
            <a href="" class="text-secondary" @click.prevent="requestConcept()">
                {{ $t('tree.new-top-concept') }}
            </a>
            <tree
                :id="treeId"
                class="col px-0 scroll-y-auto"
                :data="tree"
                :draggable="isDragAllowed"
                :drop-allowed="isDropAllowed"
                size="small"
                @change="itemClick"
                @drop="itemDrop"
                @toggle="itemToggle">
            </tree>
            <a href="" class="text-secondary" @click.prevent="requestConcept()">
                {{ $t('tree.new-top-concept') }}
            </a>
        </div>
    </div>
</template>

<script>
    import * as treeUtility from 'tree-vue-component';
    import { VueContext } from 'vue-context';
    import VueScrollTo from 'vue-scrollto';
    import { transliterate as tr, slugify } from 'transliteration';
    import DeleteConceptModal from './modals/DeleteConceptModal.vue';

    Vue.component('tree-node', require('./TreeNode.vue'));
    Vue.component('tree-contextmenu', require('./TreeContextMenu.vue'));
    Vue.component('tree-search', require('./TreeSearch.vue'));
    Vue.use(VueScrollTo);

    const DropPosition = {
        empty: 0,
        up: 1,
        inside: 2,
        down: 3,
    };

    class Node {
        constructor(data, vm) {
            Object.assign(this, data);
            this.state = {
                opened: false,
                selected: false,
                disabled: false,
                loading: false,
                highlighted: false,
                openable: this.children_count > 0,
                dropPosition: DropPosition.empty,
                dropAllowed: true,
            };
            this.eventBus = vm.eventBus;
            this.treeName = vm.treeName;
            this.icon = false;
            this.children = [];
            this.childrenLoaded = this.children.length == this.children_count;
            this.component = 'tree-node';
            this.contextmenu = 'tree-contextmenu';
            this.dragDelay = vm.dragDelay;
            this.dragAllowed = _ => vm.isDragAllowed;
            this.onToggle = vm.itemToggle;
        }
    }

    export default {
        props: {
            treeData: {
                required: true,
                type: Array
            },
            treeName: {
                required: true,
                type: String
            },
            eventBus: {
                required: true,
                type: Object
            },
            selectedEntity: {
                required: false,
                type: Object
            },
            dragDelay: {
                required: false,
                type: Number,
                default: 500
            }
        },
        mounted() {
            this.init();
        },
        created() {
            this.eventBus.$on(`concept-selected-${this.treeName}`, (e) => {
                this.selectConcept(e.concept);
            });
            this.eventBus.$on(`concept-created-${this.treeName}`, this.handleConceptCreated);
            this.eventBus.$on(`label-update-${this.treeName}`, this.handleLabelUpdate);
            this.eventBus.$on(`relation-updated-${this.treeName}`, this.handleRelationUpdate);

            this.eventBus.$on(`cm-item-add-${this.treeName}`, this.handleAddConceptRequest);
            this.eventBus.$on(`cm-item-export-${this.treeName}`, this.handleConceptExport);
            this.eventBus.$on(`cm-item-delete-${this.treeName}`, this.handleConceptDelete);

            this.eventBus.$on(`dc-delete-all-${this.treeName}`, this.handleDeleteAll);
            this.eventBus.$on(`dc-delete-one-${this.treeName}`, this.handleDeleteOneUp);
        },
        beforeDestroy() {
            this.eventBus.$off(`concept-selected-${this.treeName}`);
            this.eventBus.$off(`concept-created-${this.treeName}`);
            this.eventBus.$off(`label-update-${this.treeName}`);
            this.eventBus.$off(`broader-added-${this.treeName}`);

            this.eventBus.$off(`cm-item-add-${this.treeName}`);
            this.eventBus.$off(`cm-item-export-${this.treeName}`);
            this.eventBus.$off(`cm-item-delete-${this.treeName}`);

            this.eventBus.$off(`dc-delete-all-${this.treeName}`);
            this.eventBus.$off(`dc-delete-one-${this.treeName}`);
        },
        methods: {
            itemClick(eventData) {
                const item = eventData.data;
                this.eventBus.$emit('concept-clicked', {
                    id: item.id,
                    from: this.treeName
                });
            },
            itemToggle(eventData) {
                const item = eventData.data;
                if(item.children.length < item.children_count) {
                    item.state.loading = true;
                    this.fetchChildren(item.id).then(response => {
                        item.children =  response;
                        item.state.loading = false;
                        item.childrenLoaded = true;
                    });
                }
                item.state.opened = !item.state.opened;
            },
            itemDrop(dropData) {
                if(!this.isDragAllowed || !this.isDropAllowed(dropData)) {
                    return;
                }

                const vm = this;
                const node = dropData.sourceData;
                const newRank = vm.getNewRank(dropData);
                const oldRank = node.rank;
                let newParent;
                const oldParent = treeUtility.getNodeFromPath(this.tree, dropData.sourcePath.slice(0, dropData.sourcePath.length - 1));
                if(dropData.targetData.state.dropPosition == DropPosition.inside) {
                    newParent = dropData.targetData;
                } else {
                    newParent = treeUtility.getNodeFromPath(this.tree, dropData.targetPath.slice(0, dropData.targetPath.length - 1));
                }

                if (newParent == oldParent && newRank == oldRank) {
                    return;
                }

                let data = {
                    id: node.id,
                    rank: newRank,
                    parent_id: newParent ? newParent.id : null
                };

                $httpQueue.add(() => vm.$http.patch(`/entity/${node.id}/rank`, data).then(function(response) {
                    vm.removeFromTree(node, dropData.sourcePath);
                    node.rank = newRank;
                    vm.insertIntoTree(node, newParent);
                }));
            },
            requestConcept(parent, text = '') {
                this.$emit('request-concept', {
                    parent: parent,
                    text: text,
                    tree: this.treeName
                });
            },
            fetchChildren(id) {
                return $httpQueue.add(() => $http.get(`/tree/byParent/${id}?t=${this.treeName}`)
                .then(response => {
                    const newNodes = response.data.map(e => {
                        let n;
                        if(this.concepts[e.id]) {
                            n = this.concepts[e.id];
                        } else {
                            n = new Node(e, this);
                            this.concepts[n.id] = n;
                        }
                        return n;
                    });
                    return newNodes;
                }));
            },
            requestDeleteEntity(entity, path) {
                const vm = this;
                if(!vm.$can('delete_move_concepts')) return;
                vm.$modal.show(DeleteEntityModal, {
                    entity: entity,
                    onDelete: e => vm.onDelete(e, path)
                })
            },
            onDelete(entity, path) {
                const vm = this;
                if(!vm.$can('delete_move_concepts')) return;
                const id = entity.id;
                $httpQueue.add(() => $http.delete(`/entity/${id}`).then(response => {
                    // if deleted entity is currently selected entity...
                    if(id == vm.selectedEntity.id) {
                        // ...unset it
                        this.$router.push({
                            append: true,
                            name: 'home',
                            query: vm.$route.query
                        });
                    }
                    vm.$showToast(
                        this.$t('main.entity.toasts.deleted.title'),
                        this.$t('main.entity.toasts.deleted.msg', {
                            name: entity.name
                        }),
                        'success'
                    );
                    vm.removeFromTree(entity, path);
                }));
            },
            removeFromTree(entity, path) {
                const vm = this;
                const index = path.pop();
                const parent = treeUtility.getNodeFromPath(vm.tree, path);
                const siblings = parent ? parent.children : vm.tree;
                siblings.splice(index, 1);
                siblings.map(s => {
                    if(s.rank > entity.rank) {
                        s.rank--;
                    }
                });

                if (parent) {
                    parent.children_count--;
                    parent.state.openable = parent.children_count > 0;
                }
                delete vm.entities[entity.id];
            },
            init() {
                this.treeData.forEach(e => {
                    const n = new Node(e, this);
                    this.concepts[n.id] = n;
                    this.tree.push(n);
                });
            },
            triggerFileUpload(type) {
                this.importType = type;
                this.$refs.upload.$el.children.file.click();
            },
            importFile(newFile, oldFile) {
                // Wait for response
                if(newFile && oldFile && newFile.success && !oldFile.success) {
                    this.filesUploaded++;
                }
                if(newFile && oldFile && newFile.error && !oldFile.error) {
                    this.filesErrored++;
                }
                // Enable automatic upload
                if(Boolean(newFile) !== Boolean(oldFile) || oldFile.error !== newFile.error) {
                    if(!this.$refs.upload.active) {
                        this.$refs.upload.active = true
                    }
                }
                if(this.filesUploaded + this.filesErrored == this.uploadFiles.length) {
                    if(this.filesUploaded > 0) {
                        this.filesUploaded = 0;
                        this.filesErrored = 0;
                        // TODO handle update
                    }
                }
            },
            uploadFile(file, component) {
                let formData = new FormData();
                formData.append('file', file.file);
                formData.append('type', this.importType);
                return $http.post(`tree/file?t=${this.treeName}`, formData);
            },
            exportTree(rootElement) {
                if(rootElement) {
                    let filename = `thesaurex-${this.$getLabel(rootElement)}-export.rdf`;
                    const id = rootElement.id;
                    $httpQueue.add(() => $http.get(`tree/${id}/export`).then(response => {
                        this.$createDownloadLink(response.data, filename, false, response.headers['content-type']);
                    }));
                } else {
                    let filename = `thesaurex-export.rdf`;
                    $httpQueue.add(() => $http.get(`tree/export`).then(response => {
                        this.$createDownloadLink(response.data, filename, false, response.headers['content-type']);
                    }));
                }
            },
            handleAddConceptRequest(e) {
                this.requestConcept(e.element);
            },
            handleConceptExport(e) {
                this.exportTree(e.element);
            },
            handleConceptDelete(e) {
                const opts = {
                    treeName: this.treeName,
                    eventBus: this.eventBus
                };
                const props = Object.assign({}, e, opts);
                this.$modal.show(DeleteConceptModal, props);
            },
            handleDeleteAll(e) {
                const id = e.element.id;
                $httpQueue.add(() => $http.delete(`/tree/concept/${id}`).then(response => {
                    // TODO handle update (sub-tree deleted)
                    this.concepts[id] = null;
                }));
            },
            handleDeleteOneUp(e) {
                const id = e.element.id;
                $httpQueue.add(() => $http.delete(`/tree/concept/${id}/move`).then(response => {
                    // TODO handle update (concept deleted, descs one level up)
                }));
            },
            handleConceptCreated(e) {
                const parent = this.concepts[e.parent_id];
                const n = new Node(e.concept, this);
                n.selectedLabel = this.$getLabel(n);
                this.concepts[n.id] = n;

                this.eventBus.$emit(`relation-updated-${this.treeName}`, {
                    type: 'add',
                    concept: this.concepts[e.concept.id],
                    broader_id: e.parent_id ? parent.id : undefined,
                    narrower_id: e.concept.id
                });
            },
            handleLabelUpdate(e) {
                let concept = this.concepts[e.concept_id];
                concept.labels = e.labels;
            },
            handleRelationUpdate(e) {
                let broader;
                let narrower;
                switch(e.type) {
                    case 'add':
                        broader = this.concepts[e.broader_id];
                        narrower = this.concepts[e.narrower_id];
                        if(e.broader_id && !broader.childrenLoaded) {
                            broader.children_count++;
                            break;
                        }
                        let siblings = e.broader_id ? broader.children : this.tree;
                        siblings.push(narrower);
                        break;
                    case 'remove':
                        broader = this.concepts[e.broader_id];
                        narrower = this.concepts[e.narrower_id];
                        broader.children_count--;
                        if(broader.childrenLoaded) {
                            const childIndex = broader.children.findIndex(c => {
                                return c.id == narrower.id;
                            });
                            if(childIndex > -1) {
                                broader.children.splice(childIndex, 1);
                            }
                        }
                        break;
                }
            },
            isDropAllowed(dropData) {
                //TODO check if it works with tree-vue-component
                const item = dropData.sourceData;
                const target = dropData.targetData;
                const vm = this;
                const dragEntityType = vm.$getEntityType(item.entity_type_id);

                if(target.parentIds.indexOf(item.id) != -1 ||
                   (target.state.dropPosition == DropPosition.inside && target.id == item.root_entity_id)) {
                    return false;
                }
                let dropEntityType;
                if(dropData.targetPath.length == 1) {
                    dropEntityType = {
                        sub_entity_types: Object.values(vm.$getEntityTypes()).filter(f => f.is_root)
                    }
                } else {
                    dropEntityType = vm.$getEntityType(target.entity_type_id);
                }
                // If currently dragged element is not allowed as root
                // and dragged on element is a root element (no parent)
                // do not allow drop
                if(!dragEntityType.is_root && dropData.targetPath.length == 1) {
                    return false;
                }

                // Check if currently dragged entity type is allowed
                // as subtype of current drop target
                const index = dropEntityType.sub_entity_types.findIndex(ct => ct.id == dragEntityType.id);
                if(index == -1) {
                    return false;
                }
                // In any other cases allow drop
                return true;
            },
            onSearchMultiSelect(items) {
                this.resetHighlighting();
                this.highlightItems(items);
            },
            onSearchClear() {
                this.resetHighlighting();
            },
            highlightItems(items) {
                items.forEach(i => {
                    return this.openPath(i.path).then(targetNode => {
                        targetNode.state.highlighted = true;
                        this.highlightedItems.push(targetNode);
                    });
                });
            },
            resetHighlighting() {
                this.highlightedItems.forEach(i => i.state.highlighted = false);
                this.highlightedItems = [];
            },
            async openPath(ids, tree = this.tree) {
                const index = ids.pop();
                const elem = this.concepts[index];
                if(ids.length == 0) {
                    return elem;
                }
                if(!elem.childrenLoaded) {
                    elem.state.loading = true;
                    const children = await this.fetchChildren(elem.id);
                    elem.state.loading = false;
                    elem.children = children;
                    elem.childrenLoaded = true;
                }
                elem.state.opened = true;
                return this.openPath(ids, elem.children);
            },
            selectConcept(concept) {
                if(this.selectedConceptId != -1 && concept.id != this.selectedConceptId) {
                    this.deselectConcept(this.selectedConceptId);
                }
                this.selectedConceptId = concept.id;
                this.openPath(concept.path.slice()).then(targetNode => {
                    targetNode.state.selected = true;
                    // Scroll tree to selected element
                    const elem = document.getElementById(`tree-node-${targetNode.id}`);
                    VueScrollTo.scrollTo(elem, this.scrollTo.duration, this.scrollTo.options);
                });
            },
            deselectConcept(id) {
                if(this.concepts[id]) {
                    this.concepts[id].state.selected = false;
                    this.selectedConceptId = -1;
                }
            },
            handleEntityDelete(e) {
                const id = e.entity.id;
                if(!id) return;
                const path = document.getElementById(`tree-node-${id}`).parentElement.getAttribute('data-path').split(',');
                this.requestDeleteEntity(e.entity, path);
            }
        },
        data() {
            return {
                concepts: [],
                tree: [],
                highlightedItems: [],
                selectedConceptId: -1,
                uploadFiles: [],
                filesUploaded: 0,
                filesErrored: 0
            }
        },
        computed: {
            topLevelCount() {
                return this.tree.length || 0;
            },
            isDragAllowed() {
                return true;
            },
            treeId() {
                return `concept-tree-${this.treeName}`;
            },
            scrollTo() {
                return {
                    duration: 500,
                    options: {
                        container: `#${this.treeId}`,
                        force: false,
                        cancelable: true,
                        x: false,
                        y: true
                    }
                };
            }
        }
    }
</script>
