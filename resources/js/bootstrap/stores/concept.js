import {defineStore} from 'pinia';

import {
    addConcept,
    addLabel,
    addNote,
    addRelation,
    cloneAcrossTree,
    deleteConcept,
    deleteLabel,
    deleteNote,
    exportTree,
    fetchChildren,
    fetchConcept,
    fetchTreeData,
    getConceptParentIds,
    patchLabel,
    patchNote,
    removeRelation,
    uploadFile,
    toggleTopLevelState,
} from '@/api.js';

import {
    createDownloadLink,
    only,
    slugify,
} from '@/helpers/helpers.js';

import {
    getLabel,
    Node,
    openPath,
    unnode,
    sortTree,
} from '@/helpers/tree.js';

export const useConceptStore = defineStore('concept', {
    state: _ => ({
        concepts: {
            project: [],
            sandbox: [],
        },
        conceptMap: {
            project: {},
            sandbox: {},
        },
        conceptReferences: {
            project: {},
            sandbox: {},
        },
        conceptParents: {
            project: {},
            sandbox: {},
        },
        concept: {
            from: null,
            data: {},
        },
    }),
    getters: {
    },
    actions: {
        async uploadFile(file, tree, actionType) {
            const data = await uploadFile(file, tree, actionType);
            await this.initialize([tree]);
            return data;
        },
        addConceptNode(conceptNode, tree, options = {}) {
            const doCount = !options.ignore_count;

            this.conceptMap[tree][conceptNode.id] = conceptNode;
            if(!this.conceptReferences[tree][conceptNode.nid]) {
                this.conceptReferences[tree][conceptNode.nid] = [];
            }
            this.conceptReferences[tree][conceptNode.nid].push(conceptNode.id);
            let added = false;
            for(let i = 0; i < conceptNode.path.length; i++) {
                const path = conceptNode.path[i];
                // second element in path is always direct parent (first is self)
                const parentId = path[1];

                if(!!parentId) {
                    // add current node's parent to list for easier update of all occurrences
                    if(!this.conceptParents[tree][conceptNode.nid]) {
                        this.conceptParents[tree][conceptNode.nid] = [];
                    }
                    if(!this.conceptParents[tree][conceptNode.nid].includes(parentId)) {
                        this.conceptParents[tree][conceptNode.nid].push(parentId);
                    }

                    const parentConcept = this.conceptMap[tree][parentId];
                    if(!!parentConcept) {
                        if(parentConcept.childrenLoaded && parentConcept.children.findIndex(c => c.nid == conceptNode.nid) == -1) {
                            parentConcept.children.push(conceptNode);
                        }
                        if(parentConcept.narrowers) {
                            const idx = parentConcept.narrowers.findIndex(narr => {
                                if(narr.nid && conceptNode.nid) {
                                    return narr.nid == conceptNode.nid;
                                } else if(narr.nid && !conceptNode.nid) {
                                    return narr.nid == conceptNode.id;
                                } else if(!narr.nid && conceptNode.nid) {
                                    return narr.id == conceptNode.nid;
                                } else {
                                    return narr.id == conceptNode.id;
                                }
                            });
                            if(idx == -1) {
                                parentConcept.narrowers.push(conceptNode);
                            }
                        }
                        if(doCount) {
                            parentConcept.children_count++;
                            parentConcept.state.openable = true;
                        }
                    }
                } else {
                    if(!added) {
                        added = true;
                        const idx = this.concepts[tree].findIndex(node => node.nid == conceptNode.nid);
                        if(idx == -1) {
                            this.concepts[tree].push(conceptNode);
                        }
                    }
                }
            }

            this.handleConceptChange(conceptNode.id, tree);
        },
        resetConcepts(tree) {
            this.concepts[tree] = [];
            this.conceptMap[tree] = {};
            this.conceptParents[tree] = {};
        },
        initializeConcepts(concepts, tree) {
            this.resetConcepts(tree);
            sortTree(concepts);

            concepts.forEach(concept => {
                const node = new Node({
                    ...concept,
                    tree: tree,
                });
                this.addConceptNode(node, tree);
            });
        },
        async initialize(trees = []) {
            let concepts = null;
            const result = {};
            if(!Array.isArray(trees) || trees.length == 0) {
                concepts = await fetchTreeData();
            } else {
                concepts = await fetchTreeData(
                    only(
                        trees,
                        Object.keys(this.concepts)
                    )
                );
            }
            for(let tree in concepts) {
                result[tree] = this.initializeConcepts(concepts[tree], tree);
            }
            return result;
        },
        async clone(narrowerId, broaderId, srcTree, tgtTree) {
            const concept = await cloneAcrossTree(narrowerId, broaderId, srcTree, tgtTree);

            const node = new Node({
                ...concept,
                tree: tgtTree,
            });
            return this.addConceptNode(node, tree);
        },
        // method to add newly created concepts to store
        async addConcept(data, tree, broaderId) {
            const concept = await addConcept(data, tree, broaderId);
            this.addRawConcept(concept, tree);
        },
        addRawConcept(concept, tree) {
            const node = new Node({
                ...concept,
                tree: tree,
            });
            return this.addConceptNode(node, tree);
        },
        async toggleTopLevelState(id, tree) {
            const data = await toggleTopLevelState(id, tree);
            if(data.is_top_concept) {
                this.handleAddRelation(-1, data.id, tree);
            } else {
                this.handleRemoveRelation(-1, data.id, tree);
            }
            return data;
        },
        async fetchAndPushConcept(id, tree, receivedFromEvent = false) {
            const concept = await fetchConcept(id, tree);
            this.pushConcepts([concept], tree, {
                ignore_count: receivedFromEvent,
            });
        },
        async fetchChildren(id, tree) {
            tree = tree != 'sandbox' ? 'project' : tree;
            const children = await fetchChildren(id, tree);
            return this.pushConcepts(children, tree);
        },
        // method to add existing, fetched concepts to store
        pushConcepts(concepts, tree, overrides = {}) {
            const nodes = [];
            concepts.forEach(concept => {
                const node = new Node({
                    ...concept,
                    tree: tree,
                });
                this.addConceptNode(node, tree, {
                    ignore_count: overrides.ignore_count !== false,
                });
                nodes.push(node);
            });
            return nodes;
        },
        async deleteConcept(id, tree, action, parameters) {
            // use 'cascade' as default action
            action = (action == 'level' || action == 'top' || action == 'rerelate') ? action : 'cascade';
            await deleteConcept(id, tree, action, parameters);

            const conceptRefs = this.conceptReferences[tree][id];
            const parentRefs = this.conceptParents[tree][id] || [];
            // get all narrowers, simply get them from first ref
            const conceptRef = conceptRefs[0];
            const concept = this.conceptMap[tree][conceptRef];

            if(action != 'cascade') {
                let loadNarrowers = false;
                const narrowerIds = concept.narrowers.map(narrower => narrower.id);
                let broaders = null;
                if(action == 'level') {
                    broaders = concept.is_top_concept ? [...parentRefs, -1] : parentRefs;
                    loadNarrowers = true;
                } else if(action == 'top') {
                    loadNarrowers = true;
                    broaders = [-1];
                } else if(action == 'rerelate') {
                    const newParent = this.conceptMap[tree][parameters.p];
                    loadNarrowers = newParent.childrenLoaded;
                    newParent.state.openable = true;
                    broaders = [parameters.p];
                }

                // Fetch all required narrowers that are not alreaday fetched,
                // because they need to be added to the tree
                if(loadNarrowers) {
                    for(let i=0; i<narrowerIds.length; i++) {
                        const narrowerId = narrowerIds[i];
                        if(!this.conceptMap[tree][narrowerId]) {
                            await this.fetchAndPushConcept(narrowerId, tree, false);
                        }
                    }
                    
                    // Add all narrower relations to their new parent
                    this.handleAddRelation(broaders, narrowerIds, tree);
                }
                
                // Remove all relations of the deleted concept to its narrowers
                this.handleRemoveRelation(id, narrowerIds, tree);
            }

            const removeBroaders = concept.is_top_concept ? [...parentRefs, -1] : parentRefs;
            this.handleRemoveRelation(removeBroaders, [id], tree);
            this.deleteConceptReferences(id, tree);
        },
        deleteConceptReferences(id, tree) {
            const conceptRefs = this.conceptReferences[tree][id];
            conceptRefs.forEach(refId => {
                delete this.conceptMap[tree][refId];
                const idx = this.concepts[tree].findIndex(concept => concept.id == refId);
                if(idx > -1) {
                    this.concepts[tree].splice(idx, 1);
                }
            });
            delete this.conceptReferences[tree][id];
            delete this.conceptParents[tree][id];

            const loadedConcepts = this.concepts[tree];
            loadedConcepts.forEach(concept => {
                if(concept.children_count > 0 && !concept.childrenLoaded && concept.state.openable && concept.narrowers) {
                    concept.narrowers = concept.narrowers.filter(narrower => {
                        const hit = id == narrower.id;
                        if(hit) {
                            c.children_count--;
                        }
                        return !hit;
                    });
                    if(concept.narrowers.length == 0) {
                        concept.state.openable = false;
                    }
                }
            });
        },
        async setSelected(id, tree) {
            if(!id || !tree) {
                this.concept.from = null;
                this.concept.data = {};
            } else {
                let concept = this.conceptMap[tree][id];
                if(!concept) {
                    const ids = await getConceptParentIds(id, tree);
                    for(let i = 0; i < ids.length; i++) {
                        const path = ids[i];
                        await openPath(path, tree);
                    }
                    concept = this.conceptMap[tree][id];
                }
                this.concept.from = tree;
                this.concept.data = concept;
            }
        },
        pushLabel(label, conceptId, tree) {
            const concept = this.conceptMap[tree][conceptId];
            if(concept) {
                if(!concept.labels) {
                    concept.labels = [];
                }
                concept.labels.push(label);
                this.handleConceptChange(conceptId, tree, this);
            }
        },
        updateLabel(conceptId, tree, labelId, updates = {}) {
            const concept = this.conceptMap[tree][conceptId];
            if(concept?.labels) {
                const label = concept.labels.find(label => label.id == labelId);
                if(label) {
                    for(let k in updates) {
                        label[k] = updates[k];
                    }
                    this.handleConceptChange(conceptId, tree, this);
                }
            }
        },
        removeLabel(conceptId, tree, labelId, newPrefLabelId) {
            const concept = this.conceptMap[tree][conceptId];
            if(concept?.labels) {
                const idx = concept.labels.findIndex(label => label.id == labelId);
                if(idx > -1) {
                    concept.labels.splice(idx, 1);
                    if(newPrefLabelId) {
                        const label = concept.labels.find(label => label.id == newPrefLabelId);
                        if(label) {
                            label.concept_label_type = 1;
                        }
                    }
                    this.handleConceptChange(conceptId, tree, this);
                }
            }
        },
        async addLabel(id, tree, text, languageId) {
            const content = await addLabel({
                content: text,
                lid: languageId,
                cid: id,
                tree_name: tree,
            });
            this.pushLabel(content, id, tree);
        },
        async patchLabel(conceptId, tree, labelId, text) {
            await patchLabel(labelId, text, tree);
            const updateData = {
                label: text,
            };
            this.updateLabel(conceptId, tree, labelId, updateData);
        },
        async deleteLabel(conceptId, tree, labelId) {
            const updatedLabelId = await deleteLabel(labelId, tree);
            this.removeLabel(conceptId, tree, labelId, updatedLabelId);
        },
        pushNote(note, conceptId, tree) {
            const concept = this.conceptMap[tree][conceptId];
            if(concept) {
                if(!concept.notes) {
                    concept.notes = [];
                }
                concept.notes.push(note);
            }
        },
        updateNote(conceptId, tree, noteId, text) {
            const concept = this.conceptMap[tree][conceptId];
            if(concept?.notes) {
                const note = concept.notes.find(note => note.id == noteId);
                if(note) {
                    note.content = text;
                }
            }
        },
        removeNote(conceptId, tree, noteId) {
            const concept = this.conceptMap[tree][conceptId];
            if(concept?.notes) {
                const idx = concept.notes.findIndex(note => note.id == noteId);
                if(idx > -1) {
                    const concept = this.conceptMap[tree][conceptId];
                    if(concept?.notes) {
                        const idx = concept.notes.findIndex(note => note.id == noteId);
                        if(idx > -1) {
                            concept.notes.splice(idx, 1);
                        }
                    }
                }
            }
        },
        handleConceptChange(conceptId, tree) {
            const concept = this.conceptMap[tree][conceptId];
            const parents = this.conceptParents[tree][conceptId] || [];
            if(concept.is_top_concept) {
                sortTree(this.concepts[tree]);
            }
            parents.forEach(parent => {
                const parentConcept = this.conceptMap[tree][parent];
                if(!!parentConcept) {
                    sortTree(parentConcept.children);
                }
            });
        },
        async addNote(id, tree, text, languageId) {
            const content = await addNote({
                content: text,
                lid: languageId,
                cid: id,
                tree_name: tree,
            });
            this.pushNote(content, id, tree);
        },
        pushNote(note, conceptId, tree) {
            const concept = this.conceptMap[tree][conceptId];
            if(concept) {
                if(!concept.notes) {
                    concept.notes = [];
                }
                concept.notes.push(note);
            }
        },
        async patchNote(conceptId, tree, noteId, text) {
            await patchNote(noteId, text, tree);
            this.updateNote(conceptId, tree, noteId, text);
        },
        async deleteNote(conceptId, tree, noteId) {
            await deleteNote(noteId, tree);
            this.removeNote(conceptId, tree, noteId);
        },
        async addRelation(narrowerId, broaderId, tree) {
            await addRelation(narrowerId, broaderId, tree);

            if(!this.conceptMap[tree][broaderId]) {
                await this.fetchAndPushConcept(broaderId, tree);
            }
            if(!this.conceptMap[tree][narrowerId]) {
                await this.fetchAndPushConcept(narrowerId, tree);
            }

            this.handleAddRelation(broaderId, narrowerId, tree);
        },
        async removeRelation(narrowerId, broaderId, tree) {
            await removeRelation(narrowerId, broaderId, tree);

            this.handleRemoveRelation(broaderId, narrowerId, tree);
        },
        handleAddRelation(broaders, narrowers, tree) {
            const broaderIdList = Array.isArray(broaders) ? broaders : [broaders];
            const narrowerIdList = Array.isArray(narrowers) ? narrowers : [narrowers];

            broaderIdList.forEach(relBroadId => {
                narrowerIdList.forEach(relNarrId => {                    
                    const broader = unnode(this.conceptMap[tree][relBroadId]);
                    const narrower = unnode(this.conceptMap[tree][relNarrId]);
                    const broaderList = this.conceptReferences[tree][relBroadId] || [];
                    const narrowerList = this.conceptReferences[tree][relNarrId] || [];
                    const broaderIsTlc = relBroadId == -1;
                    if(broaderIsTlc) {
                        const node = new Node({
                            ...narrower,
                            tree: tree,
                        });
                        this.concepts[tree].push(node);
                        sortTree(this.concepts[tree]);

                        for(let i = 0; i < narrowerList.length; i++) {
                            const narrowerConcept = this.conceptMap[tree][narrowerList[i]];
                            if(narrowerConcept) {
                                narrowerConcept.is_top_concept = true;
                            }
                        }
                    } else {
                        for(let i = 0; i < broaderList.length; i++) {
                            const broaderConcept = this.conceptMap[tree][broaderList[i]];
                            if(broaderConcept) {
                                if(broaderConcept.children) {
                                    const node = new Node({
                                        ...narrower,
                                        tree: tree,
                                    });
                                    broaderConcept.children.push(node);
                                    sortTree(broaderConcept.children);
                                }
                                if(broaderConcept.narrowers) {
                                    if(!broaderConcept.narrowers.some(n => n.id == narrower.id)) {
                                        broaderConcept.narrowers.push(narrower);
                                        sortTree(broaderConcept.narrowers);
                                    }
                                }
                                broaderConcept.children_count++;
                                broaderConcept.state.openable = true;
                            }
                        }
                        for(let i = 0; i < narrowerList.length; i++) {
                            const narrowerConcept = this.conceptMap[tree][narrowerList[i]];
                            if(narrowerConcept) {
                                if(narrowerConcept.broaders) {
                                    if(!narrowerConcept.broaders.some(b => b.id == broader.id)) {
                                        narrowerConcept.broaders.push(broader);
                                        sortTree(narrowerConcept.broaders);
                                    }
                                }
                            }
                        }
                    }
                });
            });
        },
        handleRemoveRelation(broaders, narrowers, tree) {
            const broaderIdList = Array.isArray(broaders) ? broaders : [broaders];
            const narrowerIdList = Array.isArray(narrowers) ? narrowers : [narrowers];

            broaderIdList.forEach(relBroadId => {
                narrowerIdList.forEach(relNarrId => {
                    const broaderList = this.conceptReferences[tree][relBroadId] || [];
                    const narrowerList = this.conceptReferences[tree][relNarrId] || [];
                    const broaderIsTlc = relBroadId == -1;
                    if(broaderIsTlc) {
                        const idx = this.concepts[tree].findIndex(c => c.nid == relNarrId);
                        if(idx > -1) {
                            this.concepts[tree].splice(idx, 1);
                        }

                        for(let i = 0; i < narrowerList.length; i++) {
                            const narrowerConcept = this.conceptMap[tree][narrowerList[i]];
                            if(narrowerConcept) {
                                narrowerConcept.is_top_concept = false;
                            }
                        }
                    } else {
                        for(let i = 0; i < broaderList.length; i++) {
                            const broaderConcept = this.conceptMap[tree][broaderList[i]];
                            if(broaderConcept) {
                                if(broaderConcept.children) {
                                    const idx = broaderConcept.children.findIndex(c => c.nid == relNarrId || c.id == relNarrId);
                                    if(idx > -1) {
                                        broaderConcept.children.splice(idx, 1);
                                    }
                                }
                                if(broaderConcept.narrowers) {
                                    const idx = broaderConcept.narrowers.findIndex(n => n.id == relNarrId);
                                    if(idx > -1) {
                                        broaderConcept.narrowers.splice(idx, 1);
                                    }
                                }
                                broaderConcept.children_count--;
                                broaderConcept.state.openable = broaderConcept.children_count != 0;
                            }
                        }
                        for(let i = 0; i < narrowerList.length; i++) {
                            const narrowerConcept = this.conceptMap[tree][narrowerList[i]];
                            if(narrowerConcept) {
                                if(narrowerConcept.broaders) {
                                    const idx = narrowerConcept.broaders.findIndex(c => c.nid == relBroadId || c.id == relBroadId);
                                    if(idx > -1) {
                                        narrowerConcept.broaders.splice(idx, 1);
                                    }
                                }
                            }
                        }
                    }
                });
            });
        },
        // currently only updating is_top_concept is allowed/handled
        async handleConceptUpdate(conceptId, tree, isTopConcept) {
            let fetched = false;
            if(!this.conceptMap[tree][conceptId]) {
                fetched = true;
                await this.fetchAndPushConcept(conceptId, tree);
            }

            // if we had to fetch concept it is already up to date,
            // no need to add relation
            if(fetched) return;

            if(isTopConcept) {
                this.handleAddRelation(-1, conceptId, tree);
            } else {
                this.handleRemoveRelation(-1, conceptId, tree);
            }
        },
        export(tree, fromNode) {
            let filename = '';
            if(fromNode) {
                const concept = this.conceptMap[tree][fromNode];
                const label = slugify(getLabel(concept));
                filename = `thesaurex-${tree}-${label}-export.rdf`;
            } else {
                filename = `thesaurex-${tree}-export.rdf`;
            }

            exportTree(tree, fromNode).then(response => {
                createDownloadLink(
                    response.data,
                    filename,
                    false,
                    response.headers['content-type']
                );
            });
        }
    },
});

export default useConceptStore;
