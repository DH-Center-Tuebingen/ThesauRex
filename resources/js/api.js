import {
    default as http,
} from '@/bootstrap/http.js';
import store from '@/bootstrap/store.js';
import auth from '@/bootstrap/auth.js';

import {
    only,
    throwError,
} from '@/helpers/helpers.js';

import {
    sortTree,
} from '@/helpers/tree.js';

// GET AND STORE (FETCH)
export async function fetchVersion() {
    await $httpQueue.add(() => http.get('/version').then(response => {
        store.dispatch('setVersion', response.data);
    }));
};

export async function fetchPreData(locale) {
    return $httpQueue.add(() => http.get('pre').then(response => {
        store.dispatch('setPreferences', response.data.preferences);
        store.dispatch('setSystemPreferences', response.data.system_preferences);
        store.dispatch('setStandaloneState', response.data.standalone);

        if(auth.ready()) {
            auth.load().then(_ => {
                locale.value = store.getters.preferenceByKey('prefs.gui-language');
            });
        } else {
            locale.value = store.getters.preferenceByKey('prefs.gui-language');
        }
    }));
};

export async function fetchTreeData(include = ['project', 'sandbox']) {
    if(include.includes("project")) {
        await $httpQueue.add(() =>
            http.get("/tree?t=project").then((response) => {
                const sortedConcepts = response.data;
                sortTree(sortedConcepts);
                store.dispatch("setConcepts", {
                    tree: "project",
                    concepts: sortedConcepts,
                });
            })
        );
    }
    if(include.includes('sandbox')) {
        await $httpQueue.add(
            () => http.get('/tree?t=sandbox').then(response => {
                const sortedConcepts = response.data;
                sortTree(sortedConcepts);
                store.dispatch('setConcepts', {
                    tree: 'sandbox',
                    concepts: sortedConcepts,
                });
            })
        );
    }
};

export async function fetchUsers() {
    store.dispatch('setUser', auth.user());
    await $httpQueue.add(() => http.get('user').then(response => {
        store.dispatch('setUsers', {
            active: response.data.users,
            deleted: response.data.deleted_users || []
        });
    }));
    await $httpQueue.add(() => http.get('role').then(response => {
        store.dispatch('setRoles', {
            roles: response.data.roles,
            permissions: response.data.permissions,
            presets: response.data.presets,
        });
    }));
};

export async function fetchLanguages() {
    await $httpQueue.add(
        () => http.get('/language').then(response => {
            store.dispatch('setLanguages', response.data);
        })
    );
};

export async function fetchChildren(id, tree = 'project') {
    return $httpQueue.add(
        () => http.get(`/tree/byParent/${id}?t=${tree}`).then(response => {
            const sortedChildren = response.data;
            sortTree(sortedChildren);
            return sortedChildren;
        })
    );
};

// GET

export async function getConceptParentIds(id, tree) {
    return await $httpQueue.add(() =>
        http.get(`/tree/${id}/parentIds?t=${tree}`).then((response) => {
            return response.data;
        })
    );
};

export async function uploadFile(file, tree, type) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return $httpQueue.add(
        () => http.post(`/tree?t=${tree}`, formData)
            .then(response => response.data)
            .catch(error => {
                throwError(error);
            })
    );
}

export async function exportTree(tree, rootId) {
    let endpoint = '';
    if(rootId) {
        endpoint = `tree/export/${rootId}`;
    } else {
        endpoint = `tree/export`;
    }

    return $httpQueue.add(
        () => http.get(endpoint)
    );
};

// POST
export async function addUser(user) {
    const data = only(user, ['name', 'nickname', 'email', 'password']);
    return $httpQueue.add(
        () =>  http.post('user', data).then(response => response.data)
    );
};

export async function setUserAvatar(file) {
    let formData = new FormData();
    formData.append('file', file);
    return await $httpQueue.add(
        () => http.post(`user/avatar`, formData).then(response => response.data)
    );
};

export async function addRole(role) {
    const data = only(role, ['name', 'display_name', 'description', 'derived_from']);
    return $httpQueue.add(
        () =>  http.post('role', data).then(response => response.data)
    );
};

export async function sendResetPasswordMail(email) {
    const data = {
        email: email,
    };
    return $httpQueue.add(
        () => http.post(`user/reset/password`, data).then(response => response.data)
    );
};

export async function addLanguage(languageData) {
    await $httpQueue.add(
        () => http.post('/language', languageData).then(response => {
            store.dispatch('addLanguage', response.data);
        })
    );
};

// PATCH

export async function patchLabel(id, content, concept_id, tree) {
    const data = {
        label: content,
    };
    return await $httpQueue.add(
        () => http.patch(`/tree/label/${id}?t=${tree}`, data).then(response => {
            store.dispatch('updateLabel', {
                tree: tree,
                concept_id: concept_id,
                label_id: id,
                label: content,
            });
            handleConceptChange(concept_id, tree);
            return response.data;
        })
    );
};

export async function patchNote(id, content, concept_id, tree) {
    const data = {
        content: content,
    };
    return await $httpQueue.add(
        () => http.patch(`/tree/note/${id}?t=${tree}`, data).then(response => {
            store.dispatch('updateNote', {
                tree: tree,
                concept_id: concept_id,
                note_id: id,
                content: content,
            });
            return response.data;
        })
    );
};

export async function patchPreferences(data, uid) {
    const endpoint = !!uid ? `preference/${uid}` : 'preference';
    return await http.patch(endpoint, data).then(response => response.data);
};

export async function reactivateUser(uid) {
    return $httpQueue.add(
        () => http.patch(`user/restore/${uid}`).then(response => response.data)
    );
};

export async function patchUserData(uid, data) {
    return $httpQueue.add(
        () => http.patch(`user/${uid}`, data).then(response => response.data)
    );
};

export async function patchRoleData(rid, data) {
    return $httpQueue.add(
        () => http.patch(`role/${rid}`, data).then(response => response.data)
    );
};

// PUT

export async function putAddLabel(data) {
    return $httpQueue.add(
        () => http.put(`/tree/label`, data).then(response => {
            store.dispatch('addLabel', {
                tree: data.tree_name,
                concept_id: data.cid,
                label: response.data,
            });
            handleConceptChange(data.cid, data.tree_name);
            return response.data;
        })
    );
};

export async function putAddNote(data) {
    return $httpQueue.add(
        () => http.put(`/tree/note`, data).then(response => {
            store.dispatch('addNote', {
                tree: data.tree_name,
                concept_id: data.cid,
                note: response.data,
            });
            return response.data
        })
    );
};

// DELETE

export async function deleteLanguage(languageId) {
    await $httpQueue.add(
        () => http.delete(`/language/${languageId}`).then(response => {
            store.dispatch('removeLanguage', {
                language_id: languageId,
            });
        })
    );
};

export async function deleteLabel(id, tree, concept_id) {
    await $httpQueue.add(
        () => http.delete(`/tree/label/${id}`).then(response => {
            store.dispatch('deleteLabel', {
                id: id,
                concept_id: concept_id,
                tree: tree,
                updated_label: response.data,
            });
            handleConceptChange(concept_id, tree);
        })
    );
};

export async function deleteNote(id, tree, concept_id) {
    await $httpQueue.add(
        () => http.delete(`/tree/note/${id}`).then(_ => {
            store.dispatch('deleteNote', {
                id: id,
                concept_id: concept_id,
                tree: tree,
            });
        })
    );
};

export async function addConcept(concept, tree, broader_id) {
    const data = {
        label: concept.label,
        language_id: concept.language.id,
    };
    if(broader_id) {
        data.parent_id = broader_id;
    }
    return await $httpQueue.add(
        () => http.put(`/tree/concept?t=${tree}`, data).then(response => {
            store.dispatch('addConcept', {
                concept: response.data,
                tree: tree,
            });
            handleConceptChange(response.data.id, tree);
        })
    )
};

export async function cloneAcrossTree(narrower_id, broader_id, srcNodeTree, tgtNodeTree) {
    const endpoint = `/tree/concept/clone/${narrower_id}/to/${broader_id}?t=${tgtNodeTree}&s=${srcNodeTree}`;
    return await $httpQueue.add(
        () => http.put(endpoint).then(response => {
            store.dispatch('addConcept', {
                concept: response.data,
                tree: tgtNodeTree,
            });
        })
    );
};

export async function addRelation(narrower_id, broader_id, tree) {
    await $httpQueue.add(
        () => http.put(`/tree/concept/${narrower_id}/broader/${broader_id}?t=${tree}`)
    );
    if(!store.getters.conceptsFromMap(tree)[broader_id]) {
        await $httpQueue.add(
            () => http.get(`/tree/${broader_id}?t=${tree}`).then(response => {
                store.dispatch('addConcept', {
                    concept: response.data,
                    tree: tree,
                });
            })
        );
    }
    if(!store.getters.conceptsFromMap(tree)[narrower_id]) {
        await $httpQueue.add(
            () => http.get(`/tree/${narrower_id}?t=${tree}`).then(response => {
                store.dispatch('addConcept', {
                    concept: response.data,
                    tree: tree,
                });
            })
        );
    }
    store.dispatch('addRelation', {
        broader: broader_id,
        narrower: narrower_id,
        tree: tree,
    });
};

export async function removeRelation(narrower_id, broader_id, tree) {
    return await $httpQueue.add(
        () => http.delete(`/tree/concept/${narrower_id}/broader/${broader_id}?t=${tree}`).then(response => {
            store.dispatch('removeRelation', {
                broader: broader_id,
                narrower: narrower_id,
                tree: tree,
            });
        })
    );
};

export async function deactivateUser(id) {
    return $httpQueue.add(
        () =>  http.delete(`user/${id}`).then(response => response.data)
    );
};

export async function deleteRole(id) {
    return $httpQueue.add(
        () => http.delete(`role/${id}`).then(response => response.data)
    );
};

export async function deleteUserAvatar() {
    return await $httpQueue.add(
        () => http.delete(`user/avatar`).then(response => response.data)
    );
};

// SEARCH

export async function searchConcept(query = '', tree = 'project', excludeList = []) {
    const excludeStr = JSON.stringify(excludeList);
    return $httpQueue.add(
        () => http.get(`search/concept?q=${query}&t=${tree}&exc=${excludeStr}`).then(response => response.data)
    )
};

function handleConceptChange(conceptId, tree) {
    const concept = store.getters.conceptsFromMap(tree)[conceptId];
    const parents = store.getters.parentsFromTree(tree)[conceptId] || [];
    if(concept.is_top_concept) {
        sortTree(store.getters.conceptsFromTree(tree));
    }
    parents.forEach(p => {
        const parentConcept = store.getters.conceptsFromMap(tree)[p.id];
        sortTree(parentConcept.children);
    });
}
