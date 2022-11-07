import store from '@/bootstrap/store.js';
import i18n from '@/bootstrap/i18n.js';

import { addToast } from '@/plugins/toast.js';

import {
    addUser,
    addRole,
    patchRoleData,
    deactivateUser,
    deleteRole,
    addLanguage,
    deleteLanguage,
    addConcept,
    deleteConcept,
} from '@/api.js';

import {
    can,
    getTs,
    getRoleBy,
} from '@/helpers/helpers.js';

import About from '@/components/modals/system/About.vue';
import Discard from '@/components/modals/system/Discard.vue';
import Error from '@/components/modals/system/Error.vue';
import UserInfo from '@/components/modals/user/UserInfo.vue';
import AddUser from '@/components/modals/user/Add.vue';
import DeactiveUser from '@/components/modals/user/Deactivate.vue';
import AccessControl from '@/components/modals/role/AccessControl.vue';
import AddRole from '@/components/modals/role/Add.vue';
import DeleteRole from '@/components/modals/role/Delete.vue';
import CreateConcept from '@/components/modals/concept/Create.vue';
import DeleteConcept from '@/components/modals/concept/Delete.vue';
import AddLanguage from '@/components/modals/lang/Create.vue';
import DeleteLanguage from '@/components/modals/lang/Delete.vue';

export function showAbout() {
    const uid = `AboutModal-${getTs()}`;
    store.getters.vfm.show({
        component: About,
        bind: {
            name: uid,
        },
        on: {
            closing(e) {
                store.getters.vfm.hide(uid);
            }
        }
    });
}

export function showDiscard(target, resetData, onBeforeConfirm) {
    const pushRoute = _ => {
        store.getters.vfm.hide(uid);
        resetData();
        router.push(target);
    };
    const uid = `Discard-${getTs()}`;
    store.getters.vfm.show({
        component: Discard,
        bind: {
            name: uid,
        },
        on: {
            cancel(e) {
                store.getters.vfm.hide(uid);
            },
            confirm(e) {
                pushRoute();
            },
            saveConfirm(e) {
                if (!!onBeforeConfirm) {
                    onBeforeConfirm().then(_ => {
                        pushRoute();
                    }).catch(e => {
                        store.getters.vfm.hide(uid);
                        return false;
                    });
                } else {
                    pushRoute();
                }
            },
        }
    });
}

export function showError(data) {
    const uid = `ErrorModal-${getTs()}`;
    store.getters.vfm.show({
        component: Error,
        bind: {
            data: data,
            name: uid,
        },
        on: {
            closing(e) {
                store.getters.vfm.hide(uid);
            }
        }
    });
}

export function showUserInfo(user) {
    const uid = `UserInfoModal-${getTs()}`;
    store.getters.vfm.show({
        component: UserInfo,
        bind: {
            name: uid,
            user: user,
        },
        on: {
            closing(e) {
                store.getters.vfm.hide(uid);
            }
        }
    });
}

export function showAddUser(onAdded) {
    const uid = `AddUser-${getTs()}`;
    store.getters.vfm.show({
        component: AddUser,
        bind: {
            name: uid,
        },
        on: {
            add(e) {
                if(!can('users_roles_create')) return;
                addUser(e).then(user => {
                    if(!!onAdded) {
                        onAdded();
                    }
                    store.dispatch('addUser', user);
                    store.getters.vfm.hide(uid);
                });
            },
            cancel(e) {
                store.getters.vfm.hide(uid);
            }
        }
    });
}

export function showDeactivateUser(user, onDeactivated) {
    const uid = `DeactiveUser-${getTs()}`;
    store.getters.vfm.show({
        component: DeactiveUser,
        bind: {
            name: uid,
            user: user,
        },
        on: {
            deactivate(e) {
                if(!can('users_roles_delete')) {
                    store.getters.vfm.hide(uid);
                    return;
                }
                deactivateUser(user.id).then(data => {
                    if(!!onDeactivated) {
                        onDeactivated();
                    }
                    store.dispatch('deactivateUser', data);
                    store.getters.vfm.hide(uid);
                })
            },
            cancel(e) {
                store.getters.vfm.hide(uid);
            }
        }
    });
}

export function showAccessControlModal(roleId) {
    const uid = `AccessControl-${getTs()}`;
    store.getters.vfm.show({
        component: AccessControl,
        bind: {
            name: uid,
            roleId: roleId,
        },
        on: {
            save(e) {
                const data = {
                    permissions: e,
                };
                patchRoleData(roleId, data).then(data => {
                    store.dispatch('updateRole', {
                        id: roleId,
                        permissions: data.permissions,
                    });
                    const role = getRoleBy(roleId);
                    const msg = i18n.global.t('settings.role.toasts.updated.msg', {
                        name: role.display_name
                    });
                    const title = i18n.global.t('settings.role.toasts.updated.title');
                    addToast(msg, title, {
                        channel: 'success',
                    });
                })
            },
            cancel(e) {
                store.getters.vfm.hide(uid);
            }
        }
    });
}

export function showAddRole(onAdded) {
    const uid = `AddRole-${getTs()}`;
    store.getters.vfm.show({
        component: AddRole,
        bind: {
            name: uid,
        },
        on: {
            add(e) {
                if(!can('users_roles_create')) return;
                addRole(e).then(role => {
                    if(!!onAdded) {
                        onAdded();
                    }
                    store.dispatch('addRole', role);
                    store.getters.vfm.hide(uid);
                });
            },
            cancel(e) {
                store.getters.vfm.hide(uid);
            }
        }
    });
}

export function showDeleteRole(role, onDeleted) {
    const uid = `DeleteRole-${getTs()}`;
    store.getters.vfm.show({
        component: DeleteRole,
        bind: {
            name: uid,
            role: role,
        },
        on: {
            confirm(e) {
                if(!can('users_roles_delete')) return;

                deleteRole(role.id).then(_ => {
                    if(!!onDeleted) {
                        onDeleted();
                    }
                    store.dispatch('deleteRole', role);
                    store.getters.vfm.hide(uid);
                });
            },
            cancel(e) {
                store.getters.vfm.hide(uid);
            }
        }
    });
}

export function showCreateConcept(tree, pid, initValue = '') {
    const uid = `CreateConcept-${getTs()}`;
    store.getters.vfm.show({
        component: CreateConcept,
        bind: {
            name: uid,
            tree: tree,
            parentId: pid,
            initialValue: initValue,
        },
        on: {
            add(concept) {
                if(!can('thesaurus_create')) return;

                addConcept(concept, tree, pid).then(_ => {
                    store.getters.vfm.hide(uid);
                });
            },
            cancel(e) {
                store.getters.vfm.hide(uid);
            }
        }
    });
}

export function showDeleteConcept(tree, conceptId) {
    const uid = `DeleteConcept-${getTs()}`;
    store.getters.vfm.show({
        component: DeleteConcept,
        bind: {
            name: uid,
            tree: tree,
            conceptId: conceptId,
        },
        on: {
            confirm(e) {
                if(!can('thesaurus_delete')) return;

                deleteConcept(e.nid, tree, e.action, e.params).then(_ => {
                    store.getters.vfm.hide(uid);
                });
            },
            cancel(e) {
                store.getters.vfm.hide(uid);
            }
        }
    });
}

export function showAddLanguage() {
    const uid = `AddLanguage-${getTs()}`;
    store.getters.vfm.show({
        component: AddLanguage,
        bind: {
            name: uid,
        },
        on: {
            add(e) {
                if(!can('thesaurus_create')) return;

                addLanguage(e).then(_ => {
                    store.getters.vfm.hide(uid);
                });
            },
            cancel(e) {
                store.getters.vfm.hide(uid);
            }
        }
    });
}

export function showDeleteLanguage(languageId) {
    const uid = `DeleteLanguage-${getTs()}`;
    store.getters.vfm.show({
        component: DeleteLanguage,
        bind: {
            name: uid,
            languageId: languageId,
        },
        on: {
            delete(e) {
                if(!can('thesaurus_delete')) return;

                deleteLanguage(languageId).then(_ => {
                    store.getters.vfm.hide(uid);
                });
            },
            cancel(e) {
                store.getters.vfm.hide(uid);
            }
        }
    });
}
