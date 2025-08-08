import {
    default as http,
    web_http,
} from '@/bootstrap/http.js';

import {
    only,
    throwError,
} from '@/helpers/helpers.js';

import {
    sortTree,
} from '@/helpers/tree.js';

// GET AND STORE (FETCH)
export async function getCsrfCookie() {
    await $httpQueue.add(() => web_http.get('sanctum/csrf-cookie').then(_ => {}));
}

export async function logout() {
    return $httpQueue.add(() => http.post('/auth/logout'));
}

export async function fetchVersion() {
    return $httpQueue.add(() => http.get('/version').then(response => response.data));
};

export async function fetchPreData(locale) {
    return $httpQueue.add(() => http.get('pre').then(response => response.data));
};

export async function fetchTreeData(include = ['project', 'sandbox']) {
    const data = {
        project: null,
        sandbox: null,
    }
    if(include.includes("project")) {
        data.project = await $httpQueue.add(() =>
            http.get("/tree?t=project").then(response => response.data)
        );
    }
    if(include.includes('sandbox')) {
        data.sandbox = await $httpQueue.add(
            () => http.get('/tree?t=sandbox').then(response => response.data)
        );
    }

    return data;
};

export async function fetchUser() {
    return $httpQueue.add(() => http.get('/auth/user').then(response => response.data));
}

export async function fetchUsers() {
    const userData = await $httpQueue.add(() => http.get('user').then(response => response.data));
    const roleData = await $httpQueue.add(() => http.get('role').then(response => response.data));
    return {
        user: userData,
        role: roleData,
    };
}

export async function fetchLanguages() {
    return $httpQueue.add(
        () => http.get('/language').then(response => response.data)
    );
};

export async function fetchChildren(id, tree = 'project', sorted = true) {
    return $httpQueue.add(
        () => http.get(`/tree/byParent/${id}?t=${tree}`).then(response => {
            const children = response.data;
            if(sorted) {
                sortTree(children);
            }
            return children;
        })
    );
};

export async function fetchConcept(id, tree = 'project') {
    return $httpQueue.add(
        () => http.get(`/tree/${id}?t=${tree}`).then(response => response.data)
    );
};

// GET

export async function getConceptParentIds(id, tree) {
    return $httpQueue.add(() =>
        http.get(`/tree/${id}/parentIds?t=${tree}`).then(response => response.data)
    );
};

export async function uploadFile(file, tree, type) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return $httpQueue.add(
        async () => http.post(`/tree?t=${tree}`, formData).then(response => response.data)
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
    endpoint += `?t=${tree}`;

    return $httpQueue.add(
        () => http.get(endpoint)
    );
};

// POST
export async function login(credentials) {
    return $httpQueue.add(() => http.post('/auth/login', credentials).then(response => response.data));
}
export async function addUser(user) {
    const data = only(user, ['name', 'nickname', 'email', 'password']);
    return $httpQueue.add(
        () =>  http.post('user', data).then(response => response.data)
    );
};

export async function setUserAvatar(file) {
    let formData = new FormData();
    formData.append('file', file);
    return $httpQueue.add(
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
    return $httpQueue.add(
        () => http.post('/language', languageData).then(response => response.data)
    );
};

// PATCH

export async function toggleTopLevelState(id, tree) {
    return $httpQueue.add(
        () => http.patch(`/tree/state/tlc/${id}?t=${tree}`, {}).then(response => response.data)
    );
};

export async function patchLabel(id, content, tree) {
    const data = {
        label: content,
    };
    return $httpQueue.add(
        () => http.patch(`/tree/label/${id}?t=${tree}`, data).then(response => response.data)
    );
};

export async function patchNote(id, content, tree) {
    const data = {
        content: content,
    };
    return $httpQueue.add(
        () => http.patch(`/tree/note/${id}?t=${tree}`, data).then(response => response.data)
    );
};

export async function patchPreferences(changedPreferences, uid) {
    const endpoint = !!uid ? `preference/${uid}` : 'preference';
    const data = {
        changes: changedPreferences,
    };
    return $httpQueue.add(
        () => http.patch(endpoint, data).then(response => response.data)
    );
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

export async function addLabel(data) {
    return $httpQueue.add(
        () => http.put(`/tree/label`, data).then(response => response.data)
    );
};

export async function addNote(data) {
    return $httpQueue.add(
        () => http.put(`/tree/note`, data).then(response => response.data)
    );
};

// DELETE

export async function deleteLanguage(languageId) {
    return $httpQueue.add(
        () => http.delete(`/language/${languageId}`)
    );
};

export async function deleteLabel(id, tree) {
    return $httpQueue.add(
        () => http.delete(`/tree/label/${id}?t=${tree}`).then(response => response.data)
    );
};

export async function deleteNote(id, tree) {
    return $httpQueue.add(
        () => http.delete(`/tree/note/${id}?t=${tree}`).then(response => response.data)
    );
};

export async function deleteConcept(id, tree, action, actionParams) {
    let urlParams = `a=${action}`;
    if(!!actionParams) {
        for(let k in actionParams) {
            urlParams += `&${k}=${actionParams[k]}`;
        }
    }
    return $httpQueue.add(
        () => http.delete(`/tree/concept/${id}?t=${tree}&${urlParams}`).then(response => response.data)
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
    return $httpQueue.add(
        () => http.put(`/tree/concept?t=${tree}`, data).then(response => response.data)
    )
};

export async function cloneAcrossTree(narrower_id, broader_id, srcNodeTree, tgtNodeTree) {
    const endpoint = `/tree/concept/clone/${narrower_id}/to/${broader_id}?t=${tgtNodeTree}&s=${srcNodeTree}`;
    return $httpQueue.add(
        () => http.put(endpoint).then(response => response.data)
    );
};

export async function addRelation(narrower_id, broader_id, tree) {
    return $httpQueue.add(
        () => http.put(`/tree/concept/${narrower_id}/broader/${broader_id}?t=${tree}`)
    );
};

export async function removeRelation(narrower_id, broader_id, tree) {
    return $httpQueue.add(
        () => http.delete(`/tree/concept/${narrower_id}/broader/${broader_id}?t=${tree}`)
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
    return $httpQueue.add(
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
