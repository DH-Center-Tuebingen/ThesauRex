import store from '@/bootstrap/store.js';
import i18n from '@/bootstrap/i18n.js';

import {addToast} from '@/plugins/toast.js';

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
import router from '../bootstrap/router';
import {useModal} from 'vue-final-modal';


export function showAbout() {
    const uid = `AboutModal-${getTs()}`;
    const {open, close} = useModal({
        component: About,
        attrs: {
            name: uid,
        },
        listeners: {
            closing(e) {
                close(uid);
            }
        }
    });
    open();
}

export function showDiscard(target, resetData, onBeforeConfirm) {
    const uid = `Discard-${getTs()}`;
    const {open, close} = useModal({
        component: Discard,
        attrs: {
            name: uid,
        },
        listeners: {
            cancel(e) {
                close(uid);
            },
            confirm(e) {
                close(uid);
                resetData();
                router.push(target);
            },
            saveConfirm(e) {
                if(!!onBeforeConfirm) {
                    onBeforeConfirm().then(_ => {
                        close(uid);
                        resetData();
                        router.push(target);
                    }).catch(e => {
                        close(uid);
                        return false;
                    });
                } else {
                    close(uid);
                    resetData();
                    router.push(target);
                }
            },
        }
    });
    open();
}

export function showError(data) {
    const uid = `ErrorModal-${getTs()}`;
    const {open, close} = useModal({
        component: Error,
        attrs: {
            data: data,
            name: uid,
        },
        listeners: {
            closing(e) {
                close(uid);
            }
        }
    });
    open();
}

export function showUserInfo(user) {
    const uid = `UserInfoModal-${getTs()}`;
    const {open, close} = useModal({
        component: UserInfo,
        attrs: {
            name: uid,
            user: user,
        },
        listeners: {
            closing(e) {
                close(uid);
            }
        }
    });
    open();
}

export function showAddUser(onAdded) {
    const uid = `AddUser-${getTs()}`;
    const {open, close} = useModal({
        component: AddUser,
        attrs: {
            name: uid,
        },
        listeners: {
            add(e) {
                if(!can('users_roles_create')) return;
                addUser(e).then(user => {
                    if(!!onAdded) {
                        onAdded();
                    }
                    store.dispatch('addUser', user);
                    close(uid);
                });
            },
            cancel(e) {
                close(uid);
            }
        }
    });
    open();
}

export function showDeactivateUser(user, onDeactivated) {
    const uid = `DeactiveUser-${getTs()}`;
    const {open, close} = useModal({
        component: DeactiveUser,
        attrs: {
            name: uid,
            user: user,
        },
        listeners: {
            deactivate(e) {
                if(!can('users_roles_delete')) {
                    close(uid);
                    return;
                }
                deactivateUser(user.id).then(data => {
                    if(!!onDeactivated) {
                        onDeactivated();
                    }
                    store.dispatch('deactivateUser', data);
                    close(uid);
                })
            },
            cancel(e) {
                close(uid);
            }
        }
    });
    open();
}

export function showAccessControlModal(roleId) {
    const uid = `AccessControl-${getTs()}`;
    const {open, close} = useModal({
        component: AccessControl,
        attrs: {
            name: uid,
            roleId: roleId,
        },
        listeners: {
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
                close(uid);
            }
        }
    });
    open();
}

export function showAddRole(onAdded) {
    const uid = `AddRole-${getTs()}`;
    const {open, close} = useModal({
        component: AddRole,
        attrs: {
            name: uid,
        },
        listeners: {
            add(e) {
                if(!can('users_roles_create')) return;
                addRole(e).then(role => {
                    if(!!onAdded) {
                        onAdded();
                    }
                    store.dispatch('addRole', role);
                    close(uid);
                });
            },
            cancel(e) {
                close(uid);
            }
        }
    });
    open();
}

export function showDeleteRole(role, onDeleted) {
    const uid = `DeleteRole-${getTs()}`;
    const {open, close} = useModal({
        component: DeleteRole,
        attrs: {
            name: uid,
            role: role,
        },
        listeners: {
            confirm(e) {
                if(!can('users_roles_delete')) return;

                deleteRole(role.id).then(_ => {
                    if(!!onDeleted) {
                        onDeleted();
                    }
                    store.dispatch('deleteRole', role);
                    close(uid);
                });
            },
            cancel(e) {
                close(uid);
            }
        }
    });
    open();
}

export async function showCreateConcept(tree, pid, initValue = '', onClose = () => { }) {
    console.log('showCreateConcept')
    const uid = `CreateConcept-${getTs()}`;
    const {open, close} = useModal({
        component: CreateConcept,
        attrs: {
            modalName: uid,
            tree: tree,
            parentId: pid,
            initialValue: initValue,
            onSubmit: (concept) => {
                if(!can('thesaurus_create')) return;

                addConcept(concept, tree, pid).then(_ => {
                    close(uid);
                });
            },
            onCloseRequest: () => {
                close()
            },
            onDestroyed: () => {
                onClose()
            }
        }
    });

    try {
        await open();
    } catch(error) {
        console.error('Failed to open modal:', error);
        // Optionally show an error message to the user
    }
}

export function showDeleteConcept(tree, conceptId) {
    const uid = `DeleteConcept-${getTs()}`;
    const {open, close} = useModal({
        component: DeleteConcept,
        attrs: {
            name: uid,
            tree: tree,
            conceptId: conceptId,
        },
        listeners: {
            confirm(e) {
                if(!can('thesaurus_delete')) return;

                deleteConcept(e.nid, tree, e.action, e.params).then(_ => {
                    close(uid);
                });
            },
            cancel(e) {
                close(uid);
            }
        }
    });
    open();
}

export function showAddLanguage() {
    const uid = `AddLanguage-${getTs()}`;
    const {open, close} = useModal({
        component: AddLanguage,
        attrs: {
            name: uid,
        },
        listeners: {
            add(e) {
                if(!can('thesaurus_create')) return;

                addLanguage(e).then(_ => {
                    close(uid);
                });
            },
            cancel(e) {
                close(uid);
            }
        }
    });
    open();
}

export function showDeleteLanguage(languageId) {
    const uid = `DeleteLanguage-${getTs()}`;
    const {open, close} = useModal({
        component: DeleteLanguage,
        attrs: {
            name: uid,
            languageId: languageId,
        },
        listeners: {
            delete(e) {
                if(!can('thesaurus_delete')) return;

                deleteLanguage(languageId).then(_ => {
                    close(uid);
                });
            },
            cancel(e) {
                close(uid);
            }
        }
    });
    open();
}
