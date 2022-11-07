import { createStore } from 'vuex';

import {
    Node,
    openPath,
    unnode,
    sortTree,
} from '@/helpers/tree.js';

import {
    only,
} from '@/helpers/helpers.js';

import {
    getConceptParentIds,
} from '@/api.js';

export const store = createStore({
    modules: {
        core: {
            namespaced: false,
            state() {
                return {
                    appInitialized: false,
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
                    deletedUsers: [],
                    standalone: true,
                    languages: [],
                    permissions: [],
                    preferences: {},
                    systemPreferences: {},
                    roles: [],
                    rolePresets: [],
                    tree: [],
                    user: {},
                    users: [],
                    version: {},
                    vfm: {},
                };
            },
            mutations: {
                setAppInitialized(state, data) {
                    state.appInitialized = data;
                },
                setModalInstance(state, data) {
                    state.vfm = data;
                },
                addUser(state, data) {
                    state.users.push(data);
                },
                updateUser(state, data) {
                    const index = state.users.findIndex((u) => u.id == data.id);
                    if (index > -1) {
                        const cleanData = only(data, [
                            "email",
                            "roles",
                            "updated_at",
                            "deleted_at",
                        ]);
                        const currentData = state.users[index];
                        state.users[index] = {
                            ...currentData,
                            ...cleanData,
                        };
                    }
                },
                deactivateUser(state, data) {
                    const index = state.users.findIndex((u) => u.id == data.id);
                    if (index > -1) {
                        const delUser = state.users.splice(index, 1)[0];
                        delUser.deleted_at = data.deleted_at;
                        state.deletedUsers.push(delUser);
                    }
                },
                reactivateUser(state, data) {
                    const index = state.deletedUsers.findIndex(
                        (u) => u.id == data
                    );
                    if (index > -1) {
                        const reacUser = state.deletedUsers.splice(index, 1)[0];
                        state.users.push(reacUser);
                    }
                },
                addRole(state, data) {
                    state.roles.push(data);
                },
                updateRole(state, data) {
                    const index = state.roles.findIndex((r) => r.id == data.id);
                    if (index > -1) {
                        const cleanData = only(data, [
                            "display_name",
                            "description",
                            "permissions",
                            "updated_at",
                            "deleted_at",
                        ]);
                        const currentData = state.roles[index];
                        state.roles[index] = {
                            ...currentData,
                            ...cleanData,
                        };
                    }
                },
                deleteRole(state, data) {
                    const index = state.roles.findIndex((r) => r.id == data.id);
                    if (index > -1) {
                        state.roles.splice(index, 1);
                    }
                },
                addConcept(state, data) {
                    const n = data.node;
                    const doCount = !n.already_existing;
                    delete n.already_existing;

                    state.conceptMap[data.tree][n.id] = n;
                    if(!state.conceptReferences[data.tree][n.nid]) {
                        state.conceptReferences[data.tree][n.nid] = [];
                    }
                    state.conceptReferences[data.tree][n.nid].push(n.id);
                    let added = false;
                    for(let i=0; i<n.path.length; i++) {
                        const path = n.path[i];
                        // second element in path is always direct parent (first is self)
                        const parentId = path[1];

                        if(!!parentId) {
                            // add current node's parent to list for easier update of all occurrences
                            if(!state.conceptParents[data.tree][n.nid]) {
                                state.conceptParents[data.tree][n.nid] = [];
                            }
                            if(!state.conceptParents[data.tree][n.nid].includes(parentId)) {
                                state.conceptParents[data.tree][n.nid].push(parentId);
                            }

                            const parentConcept = state.conceptMap[data.tree][parentId];
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
                                    parentConcept.state.openable = true;
                                }
                            }
                        } else {
                            if(!added) {
                                added = true;
                                const idx = state.concepts[data.tree].findIndex(rn => rn.nid == n.nid);
                                if(idx == -1) {
                                    state.concepts[data.tree].push(n);
                                }
                            }
                        }
                    }
                },
                resetConcepts(state, data) {
                    state.concepts[data.tree] = [];
                    state.conceptMap[data.tree] = {};
                    state.conceptParents[data.tree] = {};
                },
                setConcepts(state, data) {
                    data.concepts.forEach((c) => {
                        const n = new Node({
                            ...c,
                            tree: data.tree,
                        });
                        state.conceptMap[data.tree][n.id] = n;
                        if(!state.conceptReferences[data.tree][n.nid]) {
                            state.conceptReferences[data.tree][n.nid] = [];
                        }
                        state.conceptReferences[data.tree][n.nid].push(n.id);
                        state.concepts[data.tree].push(n);
                    });
                },
                deleteConceptReferences(state, data) {
                    const nid = data.id;
                    const tree = data.tree;

                    const conceptRefs = state.conceptReferences[tree][nid];
                    conceptRefs.forEach(refId => {
                        delete state.conceptMap[tree][refId];
                    });
                    delete state.conceptReferences[tree][nid];
                    delete state.conceptParents[tree][nid];

                    const loadedConcepts = state.concepts[tree];
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
                setSelectedConcept(state, data) {
                    if (!data) {
                        state.concept.from = null;
                        state.concept.data = {};
                    } else {
                        state.concept.from = data.from;
                        state.concept.data = data.data;
                    }
                },
                addLabel(state, data) {
                    const concept = state.conceptMap[data.tree][data.concept_id];
                    if(concept) {
                        if(!concept.labels) {
                            concept.labels = [];
                        }
                        concept.labels.push(data.label);
                    }
                },
                updateLabel(state, data) {
                    const concept = state.conceptMap[data.tree][data.concept_id];
                    if(concept && concept.labels) {
                        const label = concept.labels.find(l => l.id == data.label_id);
                        if(label) {
                            label.label = data.label;
                        }
                    }
                },
                deleteLabel(state, data) {
                    const concept = state.conceptMap[data.tree][data.concept_id];
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
                addNote(state, data) {
                    const concept = state.conceptMap[data.tree][data.concept_id];
                    if(concept) {
                        if(!concept.notes) {
                            concept.notes = [];
                        }
                        concept.notes.push(data.note);
                    }
                },
                updateNote(state, data) {
                    const concept = state.conceptMap[data.tree][data.concept_id];
                    if(concept && concept.notes) {
                        const note = concept.notes.find(n => n.id == data.note_id);
                        if(note) {
                            note.content = data.content;
                        }
                    }
                },
                deleteNote(state, data) {
                    const concept = state.conceptMap[data.tree][data.concept_id];
                    if(concept && concept.notes) {
                        const idx = concept.notes.findIndex(n => n.id == data.id);
                        if(idx > -1) {
                            concept.notes.splice(idx, 1);
                        }
                    }
                },
                addRelation(state, data) {
                    const broaderIdList = Array.isArray(data.broader) ? data.broader : [data.broader];
                    const narrowerIdList = Array.isArray(data.narrower) ? data.narrower : [data.narrower];

                    broaderIdList.forEach(relBroadId => {
                        narrowerIdList.forEach(relNarrId => {
                            const broader = unnode(state.conceptMap[data.tree][relBroadId]);
                            const narrower = unnode(state.conceptMap[data.tree][relNarrId]);
                            const broaderList = state.conceptReferences[data.tree][relBroadId] || [];
                            const narrowerList = state.conceptReferences[data.tree][relNarrId] || [];
                            const broaderIsTlc = relBroadId == -1;
                            if(broaderIsTlc) {
                                const node = new Node({
                                    ...narrower,
                                    tree: data.tree,
                                });
                                state.concepts[data.tree].push(node);
                                sortTree(state.concepts[data.tree]);

                                for(let i=0; i<narrowerList.length; i++) {
                                    const narrowerConcept = state.conceptMap[data.tree][narrowerList[i]];
                                    if(narrowerConcept) {
                                        narrowerConcept.is_top_concept = true;
                                    }
                                }
                            } else {
                                for(let i=0; i<broaderList.length; i++) {
                                    const broaderConcept = state.conceptMap[data.tree][broaderList[i]];
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
                                            broaderConcept.narrowers.push(narrower);
                                            sortTree(broaderConcept.narrowers);
                                        }
                                        broaderConcept.children_count++;
                                        broaderConcept.state.openable = true;
                                    }
                                }
                                for(let i=0; i<narrowerList.length; i++) {
                                    const narrowerConcept = state.conceptMap[data.tree][narrowerList[i]];
                                    if(narrowerConcept) {
                                        if(narrowerConcept.broaders) {
                                            narrowerConcept.broaders.push(broader);
                                            sortTree(narrowerConcept.broaders);
                                        }
                                    }
                                }
                            }
                        });
                    });
                },
                removeRelation(state, data) {
                    const broaderIdList = Array.isArray(data.broader) ? data.broader : [data.broader];
                    const narrowerIdList = Array.isArray(data.narrower) ? data.narrower : [data.narrower];

                    broaderIdList.forEach(relBroadId => {
                        narrowerIdList.forEach(relNarrId => {
                            const broaderList = state.conceptReferences[data.tree][relBroadId] || [];
                            const narrowerList = state.conceptReferences[data.tree][relNarrId] || [];
                            const broaderIsTlc = relBroadId == -1;
                            if(broaderIsTlc) {
                                const idx = state.concepts[data.tree].findIndex(c => c.nid == relNarrId);
                                if(idx > -1) {
                                    state.concepts[data.tree].splice(idx, 1);
                                }

                                for(let i=0; i<narrowerList.length; i++) {
                                    const narrowerConcept = state.conceptMap[data.tree][narrowerList[i]];
                                    if(narrowerConcept) {
                                        narrowerConcept.is_top_concept = false;
                                    }
                                }
                            } else {
                                for(let i=0; i<broaderList.length; i++) {
                                    const broaderConcept = state.conceptMap[data.tree][broaderList[i]];
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
                                    const narrowerConcept = state.conceptMap[data.tree][narrowerList[i]];
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
                setPreferences(state, data) {
                    state.preferences = data;
                },
                setSystemPreferences(state, data) {
                    state.systemPreferences = data;
                },
                setRoles(state, data) {
                    state.roles = data;
                },
                setRolePresets(state, data) {
                    state.rolePresets = data;
                },
                setPermissions(state, data) {
                    state.permissions = data;
                },
                setUsers(state, data) {
                    state.users = data.active;
                    state.deletedUsers = data.deleted;
                },
                setUser(state, data) {
                    state.user = data;
                },
                setVersion(state, data) {
                    state.version = data;
                },
                addLanguage(state, data) {
                    state.languages.push(data);
                },
                removeLanguage(state, data) {
                    const idx = state.languages.findIndex(
                        (l) => l.id == data.language_id
                    );
                    if (idx > -1) {
                        state.languages.splice(idx, 1);
                    }
                },
                setLanguages(state, data) {
                    state.languages = data;
                },
                setStandaloneState(state, data) {
                    state.standalone = data;
                },
            },
            actions: {
                setAppState({ commit }, data) {
                    commit("setAppInitialized", data);
                },
                setModalInstance({ commit }, data) {
                    commit("setModalInstance", data);
                },
                setRoles({ commit }, data) {
                    commit("setRoles", data.roles);
                    commit("setPermissions", data.permissions);
                    commit("setRolePresets", data.presets);
                },
                setUser({ commit }, data) {
                    commit("setUser", data);
                },
                setUsers({ commit }, data) {
                    commit("setUsers", data);
                },
                addConcept({ commit }, data) {
                    const n = new Node({
                        ...data.concept,
                        tree: data.tree,
                    });
                    commit("addConcept", {
                        tree: data.tree,
                        node: n,
                    });
                },
                addConcepts({ commit }, data) {
                    const nodes = [];
                    data.concepts.forEach((c) => {
                        const n = new Node({
                            ...c,
                            tree: data.tree,
                        });
                        commit("addConcept", {
                            tree: data.tree,
                            node: {
                                ...n,
                                // flag to make sure to not increase children_count as we simply load already existing children
                                already_existing: true,
                            },
                        });
                        nodes.push(n);
                    });
                    return nodes;
                },
                resetConcepts({ commit }, data) {
                    commit("resetConcepts", data);
                },
                setConcepts({ commit }, data) {
                    commit("setConcepts", data);
                },
                deleteConcept({ commit }, data) {
                    const nid = data.id;
                    const tree = data.tree;
                    const action = data.action;
                    const params = data.params;

                    const conceptRefs = this.state.core.conceptReferences[tree][nid];
                    const parentRefs = this.state.core.conceptParents[tree][nid] || [];
                    // get all narrowers, simply get them from first ref
                    const conceptRef = conceptRefs[0];
                    const concept = this.state.core.conceptMap[tree][conceptRef];
                    if(action != '' && action != 'cascade') {
                        const narrowerIds = concept.narrowers.map(n => n.id);
                        if(action == 'level') {
                            commit("addRelation", {
                                broader: concept.is_top_concept ? [...parentRefs, -1] : parentRefs,
                                narrower: narrowerIds,
                                tree: tree,
                            });
                        } else if(action == 'top') {
                            commit("addRelation", {
                                broader: [-1],
                                narrower: narrowerIds,
                                tree: tree,
                            });
                        } else if(action == 'rerelate') {
                            commit("addRelation", {
                                broader: [params.p],
                                narrower: narrowerIds,
                                tree: tree,
                            });
                        }
                    }

                    commit("removeRelation", {
                        broader: concept.is_top_concept ? [...parentRefs, -1] : parentRefs,
                        narrower: [nid],
                        tree: tree,
                    });
                    commit("deleteConceptReferences", data);
                },
                addLabel({commit}, data) {
                    commit("addLabel", data);
                },
                updateLabel({commit}, data) {
                    commit("updateLabel", data);
                },
                deleteLabel({commit}, data) {
                    commit("deleteLabel", data);
                },
                addNote({commit}, data) {
                    commit("addNote", data);
                },
                updateNote({commit}, data) {
                    commit("updateNote", data);
                },
                deleteNote({commit}, data) {
                    commit("deleteNote", data);
                },
                addRelation({commit}, data) {
                    commit("addRelation", data);
                },
                removeRelation({commit}, data) {
                    commit("removeRelation", data);
                },
                unsetSelectedConcept({ commit }, data) {
                    commit("setSelectedConcept", null);
                },
                async setSelectedConcept({ commit, state }, data) {
                    let concept = state.conceptMap[data.tree][data.concept_id];
                    if(!concept) {
                        const ids = await getConceptParentIds(data.concept_id, data.tree);
                        for(let i=0; i<ids.length; i++) {
                            const path = ids[i];
                            await openPath(path, data.tree);
                        }
                        concept = state.conceptMap[data.tree][data.concept_id];
                    }
                    commit("setSelectedConcept", {
                        data: concept,
                        from: data.tree,
                    });
                },
                addUser({ commit }, data) {
                    commit("addUser", data);
                },
                updateUser({ commit }, data) {
                    commit("updateUser", data);
                },
                deactivateUser({ commit }, data) {
                    commit("deactivateUser", data);
                },
                reactivateUser({ commit }, data) {
                    commit("reactivateUser", data);
                },
                setPreferences({ commit }, data) {
                    commit("setPreferences", data);
                },
                setSystemPreferences({ commit }, data) {
                    commit("setSystemPreferences", data);
                },
                addRole({ commit }, data) {
                    commit("addRole", data);
                },
                updateRole({ commit }, data) {
                    commit("updateRole", data);
                },
                deleteRole({ commit }, data) {
                    commit("deleteRole", data);
                },
                setVersion({ commit }, data) {
                    commit("setVersion", data);
                },
                addLanguage({ commit }, data) {
                    commit("addLanguage", data);
                },
                removeLanguage({ commit }, data) {
                    commit("removeLanguage", data);
                },
                setLanguages({ commit }, data) {
                    commit("setLanguages", data);
                },
                setStandaloneState({ commit }, data) {
                    commit("setStandaloneState", data);
                },
            },
            getters: {
                appInitialized: (state) => state.appInitialized,
                concepts: (state) => state.concepts,
                projectConcepts: (state) => state.concepts.project,
                sandboxConcepts: (state) => state.concepts.sandbox,
                conceptsFromTree: (state) => (tree) => state.concepts[tree],
                conceptsFromMap: (state) => (tree) => state.conceptMap[tree],
                parentsFromTree: (state) => (tree) => state.conceptParents[tree],
                selectedConcept: (state) => state.concept,
                preferenceByKey: (state) => (key) => state.preferences[key],
                preferences: (state) => state.preferences,
                systemPreferences: (state) => state.systemPreferences,
                languages: (state) => state.languages,
                roles: (state) => (noPerms) => {
                    return noPerms
                        ? state.roles.map((r) => {
                              // Remove permissions from role
                              let { permissions, ...role } = r;
                              return role;
                          })
                        : state.roles;
                },
                rolePresets: (state) => state.rolePresets,
                permissions: (state) => state.permissions,
                allUsers: (state) => {
                    return [...state.users, ...state.deletedUsers];
                },
                users: (state) => state.users,
                deletedUsers: (state) => state.deletedUsers,
                user: (state) => state.user,
                isLoggedIn: (state) => !!state.user,
                version: (state) => state.version,
                vfm: (state) => state.vfm,
                isStandalone: (state) => state.standalone,
            },
        },
    },
});

export function useStore() {
    return store;
}

export default store;
