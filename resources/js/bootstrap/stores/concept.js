import { defineStore } from 'pinia';

import {
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
        addConcept(data) {
            const n = data.node;
            const doCount = !n.already_existing;
            delete n.already_existing;

            this.conceptMap[data.tree][n.id] = n;
            if(!this.conceptReferences[data.tree][n.nid]) {
                this.conceptReferences[data.tree][n.nid] = [];
            }
            this.conceptReferences[data.tree][n.nid].push(n.id);
            let added = false;
            for(let i=0; i<n.path.length; i++) {
                const path = n.path[i];
                // second element in path is always direct parent (first is self)
                const parentId = path[1];

                if(!!parentId) {
                    // add current node's parent to list for easier update of all occurrences
                    if(!this.conceptParents[data.tree][n.nid]) {
                        this.conceptParents[data.tree][n.nid] = [];
                    }
                    if(!this.conceptParents[data.tree][n.nid].includes(parentId)) {
                        this.conceptParents[data.tree][n.nid].push(parentId);
                    }

                    const parentConcept = this.conceptMap[data.tree][parentId];
                    if(!!parentConcept) {
                        if(parentConcept.childrenLoaded && parentConcept.children.findIndex(c => c.nid == n.nid) == -1) {
                            parentConcept.children.push(n);
                        }
                        if(parentConcept.narrowers) {
                            const idx = parentConcept.narrowers.findIndex(narr => {
                                if(narr.nid && n.nid) {
                                    return narr.nid == n.nid;
                                } else if(narr.nid && !n.nid) {
                                    return narr.nid == n.id;
                                } else if(!narr.nid && n.nid) {
                                    return narr.id == n.nid;
                                } else {
                                    return narr.id == n.id;
                                }
                            });
                            if(idx == -1) {
                                parentConcept.narrowers.push(n);
                            }
                        }
                        if(doCount) {
                            parentConcept.children_count++;
                            parentConcept.this.openable = true;
                        }
                    }
                } else {
                    if(!added) {
                        added = true;
                        const idx = this.concepts[data.tree].findIndex(rn => rn.nid == n.nid);
                        if(idx == -1) {
                            this.concepts[data.tree].push(n);
                        }
                    }
                }
            }
        },
        resetConcepts(tree) {
            this.concepts[tree] = [];
            this.conceptMap[tree] = {};
            this.conceptParents[tree] = {};
        },
        setConcepts(data) {
            data.concepts.forEach(c => {
                const n = new Node({
                    ...c,
                    tree: data.tree,
                });
                this.conceptMap[data.tree][n.id] = n;
                if(!this.conceptReferences[data.tree][n.nid]) {
                    this.conceptReferences[data.tree][n.nid] = [];
                }
                this.conceptReferences[data.tree][n.nid].push(n.id);
                this.concepts[data.tree].push(n);
            });
        },
        deleteConceptReferences(data) {
            const nid = data.id;
            const tree = data.tree;

            const conceptRefs = this.conceptReferences[tree][nid];
            conceptRefs.forEach(refId => {
                delete this.conceptMap[tree][refId];
            });
            delete this.conceptReferences[tree][nid];
            delete this.conceptParents[tree][nid];

            const loadedConcepts = this.concepts[tree];
            loadedConcepts.forEach(c => {
                if(c.children_count > 0 && !c.childrenLoaded && c.state.openable && c.narrowers) {
                    c.narrowers = c.narrowers.filter(n => {
                        const hit = nid == n.id;
                        if(hit) {
                            c.children_count--;
                        }
                        return !hit;
                    });
                    if(c.narrowers.length == 0) {
                        c.state.openable = false;
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
                    concept = state.conceptMap[tree][id];
                }
                this.concept.from = tree;
                this.concept.data = concept;
            }
        },
        addLabel(data) {
            const concept = this.conceptMap[data.tree][data.concept_id];
            if(concept) {
                if(!concept.labels) {
                    concept.labels = [];
                }
                concept.labels.push(data.label);
            }
        },
        updateLabel(data) {
            const concept = this.conceptMap[data.tree][data.concept_id];
            if(concept && concept.labels) {
                const label = concept.labels.find(l => l.id == data.label_id);
                if(label) {
                    label.label = data.label;
                }
            }
        },
        deleteLabel(data) {
            const concept = this.conceptMap[data.tree][data.concept_id];
            if(concept && concept.labels) {
                const idx = concept.labels.findIndex(l => l.id == data.id);
                if(idx > -1) {
                    concept.labels.splice(idx, 1);
                    if(data.updated_label && data.updated_label.updated) {
                        const label = concept.labels.find(l => l.id == data.updated_label.id);
                        if(label) {
                            label.concept_label_type = data.updated_label.type;
                        }
                    }
                }
            }
        },
        addNote(data) {
            const concept = this.conceptMap[data.tree][data.concept_id];
            if(concept) {
                if(!concept.notes) {
                    concept.notes = [];
                }
                concept.notes.push(data.note);
            }
        },
        updateNote(data) {
            const concept = this.conceptMap[data.tree][data.concept_id];
            if(concept && concept.notes) {
                const note = concept.notes.find(n => n.id == data.note_id);
                if(note) {
                    note.content = data.content;
                }
            }
        },
        deleteNote(data) {
            const concept = this.conceptMap[data.tree][data.concept_id];
            if(concept && concept.notes) {
                const idx = concept.notes.findIndex(n => n.id == data.id);
                if(idx > -1) {
                    concept.notes.splice(idx, 1);
                }
            }
        },
        addRelation(data) {
            const broaderIdList = Array.isArray(data.broader) ? data.broader : [data.broader];
            const narrowerIdList = Array.isArray(data.narrower) ? data.narrower : [data.narrower];

            broaderIdList.forEach(relBroadId => {
                narrowerIdList.forEach(relNarrId => {
                    const broader = unnode(this.conceptMap[data.tree][relBroadId]);
                    const narrower = unnode(this.conceptMap[data.tree][relNarrId]);
                    const broaderList = this.conceptReferences[data.tree][relBroadId] || [];
                    const narrowerList = this.conceptReferences[data.tree][relNarrId] || [];
                    const broaderIsTlc = relBroadId == -1;
                    if(broaderIsTlc) {
                        const node = new Node({
                            ...narrower,
                            tree: data.tree,
                        });
                        this.concepts[data.tree].push(node);
                        sortTree(this.concepts[data.tree]);

                        for(let i=0; i<narrowerList.length; i++) {
                            const narrowerConcept = this.conceptMap[data.tree][narrowerList[i]];
                            if(narrowerConcept) {
                                narrowerConcept.is_top_concept = true;
                            }
                        }
                    } else {
                        for(let i=0; i<broaderList.length; i++) {
                            const broaderConcept = this.conceptMap[data.tree][broaderList[i]];
                            if(broaderConcept) {
                                if(broaderConcept.children) {
                                    const node = new Node({
                                        ...narrower,
                                        tree: data.tree,
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
                            const narrowerConcept = this.conceptMap[data.tree][narrowerList[i]];
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
        removeRelation(data) {
            const broaderIdList = Array.isArray(data.broader) ? data.broader : [data.broader];
            const narrowerIdList = Array.isArray(data.narrower) ? data.narrower : [data.narrower];

            broaderIdList.forEach(relBroadId => {
                narrowerIdList.forEach(relNarrId => {
                    const broaderList = this.conceptReferences[data.tree][relBroadId] || [];
                    const narrowerList = this.conceptReferences[data.tree][relNarrId] || [];
                    const broaderIsTlc = relBroadId == -1;
                    if(broaderIsTlc) {
                        const idx = this.concepts[data.tree].findIndex(c => c.nid == relNarrId);
                        if(idx > -1) {
                            this.concepts[data.tree].splice(idx, 1);
                        }

                        for(let i=0; i<narrowerList.length; i++) {
                            const narrowerConcept = this.conceptMap[data.tree][narrowerList[i]];
                            if(narrowerConcept) {
                                narrowerConcept.is_top_concept = false;
                            }
                        }
                    } else {
                        for(let i=0; i<broaderList.length; i++) {
                            const broaderConcept = this.conceptMap[data.tree][broaderList[i]];
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
                            const narrowerConcept = this.conceptMap[data.tree][narrowerList[i]];
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
    },
});

export default useConceptStore;
