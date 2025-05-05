import { defineStore } from 'pinia';

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
    fetchTreeData,
    getConceptParentIds,
    patchLabel,
    patchNote,
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
            for(let i=0; i<conceptNode.path.length; i++) {
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
        async fetchConcept(id, tree) {
            const concept = await fetchConcept(id, tree);
            this.pushConcepts([concept], tree);
        },
        async fetchChildren(id, tree) {
            tree = tree != 'sandbox' ? 'project' : tree;
            const children = await fetchChildren(id, tree);
            return this.pushConcepts(children, tree);
        },
        // method to add existing, fetched concepts to store
        pushConcepts(concepts, tree) {
            const nodes = [];
            concepts.forEach(concept => {
                const node = new Node({
                    ...concept,
                    tree: tree,
                });
                this.addConceptNode(node, tree, {
                    ignore_count: true,
                });
                nodes.push(node);
            });
            return nodes;
        },
        async deleteConcept(id, tree, action, parameters) {
            await deleteConcept(id, tree, action, parameters);

            const conceptRefs = this.conceptReferences[tree][id];
            const parentRefs = this.conceptParents[tree][id] || [];
            // get all narrowers, simply get them from first ref
            const conceptRef = conceptRefs[0];
            const concept = this.conceptMap[tree][conceptRef];
            if(action != '' && action != 'cascade') {
                const narrowerIds = concept.narrowers.map(narrower => narrower.id);
                let broaders = null;
                if(action == 'level') {
                    broaders = concept.is_top_concept ? [...parentRefs, -1] : parentRefs;
                } else if(action == 'top') {
                    broaders = [-1];
                } else if(action == 'rerelate') {
                    broaders = [parameters.p];
                }
                this.addRelation(broaders, narrowerIds, tree);
            }

            const removeBroaders = concept.is_top_concept ? [...parentRefs, -1] : parentRefs;
            this.removeRelation(removeBroaders, [id], tree);
            this.deleteConceptReferences(id, tree);
        },
        deleteConceptReferences(id, tree) {
            const conceptRefs = this.conceptReferences[tree][id];
            conceptRefs.forEach(refId => {
                delete this.conceptMap[tree][refId];
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
                    for(let i=0; i<ids.length; i++) {
                        const path = ids[i];
                        await openPath(path, tree);
                    }
                    concept = this.conceptMap[tree][id];
                }
                this.concept.from = tree;
                this.concept.data = concept;
            }
        },
        async addLabel(id, tree, text, languageId) {
            const content = await addLabel({
                content: text,
                lid: languageId,
                cid: id,
                tree_name: tree,
            });
            const concept = this.conceptMap[tree][id];
            if(concept) {
                if(!concept.labels) {
                    concept.labels = [];
                }
                concept.labels.push(content);
                this.handleConceptChange(id, tree);
            }
        },
        async updateLabel(conceptId, tree, labelId, text) {
            await patchLabel(labelId, text, tree);
            const concept = this.conceptMap[tree][conceptId];
            if(concept?.labels) {
                const label = concept.labels.find(label => label.id == labelId);
                if(label) {
                    label.label = text;
                    this.handleConceptChange(conceptId, tree);
                }
            }
        },
        async deleteLabel(conceptId, tree, labelId) {
            const updatedLabel = await deleteLabel(labelId, tree);
            const concept = this.conceptMap[tree][conceptId];
            if(concept?.labels) {
                const idx = concept.labels.findIndex(label => label.id == labelId);
                if(idx > -1) {
                    concept.labels.splice(idx, 1);
                    if(updatedLabel?.updated) {
                        const label = concept.labels.find(label => label.id == updatedLabel.id);
                        if(label) {
                            label.concept_label_type = updatedLabel.type;
                        }
                    }
                    this.handleConceptChange(conceptId, tree);
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
            const concept = this.conceptMap[tree][id];
            if(concept) {
                if(!concept.notes) {
                    concept.notes = [];
                }
                concept.notes.push(content);
            }
        },
        async updateNote(conceptId, tree, noteId, text) {
            await patchNote(noteId, text, tree);
            const concept = this.conceptMap[tree][conceptId];
            if(concept?.notes) {
                const note = concept.notes.find(note => note.id == noteId);
                if(note) {
                    note.content = text;
                }
            }
        },
        async deleteNote(conceptId, tree, noteId) {
            await deleteNote(noteId, tree);
            const concept = this.conceptMap[tree][conceptId];
            if(concept?.notes) {
                const idx = concept.notes.findIndex(note => note.id == noteId);
                if(idx > -1) {
                    concept.notes.splice(idx, 1);
                }
            }
        },
        async addRelation(narrowerId, broaderId, tree) {
            await addRelation(narrowerId, broaderId, tree);

            if(!this.conceptMap[tree][broaderId]) {
                this.fetchConcept(broaderId, tree);
            }
            if(!this.conceptMap[tree][narrowerId]) {
                this.fetchConcept(narrowerId, tree);
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

                        for(let i=0; i<narrowerList.length; i++) {
                            const narrowerConcept = this.conceptMap[tree][narrowerList[i]];
                            if(narrowerConcept) {
                                narrowerConcept.is_top_concept = true;
                            }
                        }
                    } else {
                        for(let i=0; i<broaderList.length; i++) {
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
                        for(let i=0; i<narrowerList.length; i++) {
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

                        for(let i=0; i<narrowerList.length; i++) {
                            const narrowerConcept = this.conceptMap[tree][narrowerList[i]];
                            if(narrowerConcept) {
                                narrowerConcept.is_top_concept = false;
                            }
                        }
                    } else {
                        for(let i=0; i<broaderList.length; i++) {
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
                        for(let i=0; i<narrowerList.length; i++) {
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
