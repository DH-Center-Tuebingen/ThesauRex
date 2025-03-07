import store from '@/bootstrap/store.js';
import i18n from '@/bootstrap/i18n.js';

import { addToast } from '@/plugins/toast.js';

import {
    useModal,
} from 'vue-final-modal';

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
    const modal = useModal({
        component: About,
        attrs: {
            name: uid,
            onClosing(e) {
                modal.destroy();
            },
        },
    });
    modal.open();
}

export function showDiscard(target, resetData, onBeforeConfirm) {
    const pushRoute = _ => {
        modal.destroy();
        resetData();
        router.push(target);
    };
    const uid = `Discard-${getTs()}`;
    const modal = useModal({
        component: Discard,
        attrs: {
            name: uid,
            onCancel(e) {
                modal.destroy();
            },
            onConfirm(e) {
                pushRoute();
            },
            onSaveConfirm(e) {
                if (!!onBeforeConfirm) {
                    onBeforeConfirm().then(_ => {
                        pushRoute();
                    }).catch(e => {
                        modal.destroy();
                        return false;
                    });
                } else {
                    pushRoute();
                }
            },
        },
    });
    modal.open();
}

export function showError(data) {
    const uid = `ErrorModal-${getTs()}`;
    const modal = useModal({
        component: Error,
        attrs: {
            data: data,
            name: uid,
            onClosing(e) {
                modal.destroy();
            }
        },
    });
    modal.open();
}

export function showUserInfo(user) {
    const uid = `UserInfoModal-${getTs()}`;
    const modal = useModal({
        component: UserInfo,
        attrs: {
            name: uid,
            user: user,
            onClosing(e) {
                modal.destroy();
            }
        },
    });
    modal.open();
}

export function showAddUser(onAdded) {
    const uid = `AddUser-${getTs()}`;
    const modal = useModal({
        component: AddUser,
        attrs: {
            name: uid,
            onAdd(e) {
                if(!can('users_roles_create')) return;
                addUser(e).then(user => {
                    if(!!onAdded) {
                        onAdded();
                    }
                    store.dispatch('addUser', user);
                    modal.destroy();
                });
            },
            onCancel(e) {
                modal.destroy();
            }
        },
    });
    modal.open();
}

export function showDeactivateUser(user, onDeactivated) {
    const uid = `DeactiveUser-${getTs()}`;
    const modal = useModal({
        component: DeactiveUser,
        attrs: {
            name: uid,
            user: user,
            onDeactivate(e) {
                if(!can('users_roles_delete')) {
                    modal.destroy();
                    return;
                }
                deactivateUser(user.id).then(data => {
                    if(!!onDeactivated) {
                        onDeactivated();
                    }
                    store.dispatch('deactivateUser', data);
                    modal.destroy();
                })
            },
            onCancel(e) {
                modal.destroy();
            }
        },
    });
    modal.open();
}

export function showAccessControlModal(roleId) {
    const uid = `AccessControl-${getTs()}`;
    const modal = useModal({
        component: AccessControl,
        attrs: {
            name: uid,
            roleId: roleId,
            onSave(e) {
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
            onCancel(e) {
                modal.destroy();
            }
        },
    });
    modal.open();
}

export function showAddRole(onAdded) {
    const uid = `AddRole-${getTs()}`;
    const modal = useModal({
        component: AddRole,
        attrs: {
            name: uid,
            onAdd(e) {
                if(!can('users_roles_create')) return;
                addRole(e).then(role => {
                    if(!!onAdded) {
                        onAdded();
                    }
                    store.dispatch('addRole', role);
                    modal.destroy();
                });
            },
            onCancel(e) {
                modal.destroy();
            }
        },
    });
    modal.open();
}

export function showDeleteRole(role, onDeleted) {
    const uid = `DeleteRole-${getTs()}`;
    const modal = useModal({
        component: DeleteRole,
        attrs: {
            name: uid,
            role: role,
            onConfirm(e) {
                if(!can('users_roles_delete')) return;

                deleteRole(role.id).then(_ => {
                    if(!!onDeleted) {
                        onDeleted();
                    }
                    store.dispatch('deleteRole', role);
                    modal.destroy();
                });
            },
            onCancel(e) {
                modal.destroy();
            }
        },
    });
    modal.open();
}

export function showCreateConcept(tree, pid, initValue = '') {
    const uid = `CreateConcept-${getTs()}`;
    const modal = useModal({
        component: CreateConcept,
        attrs: {
            name: uid,
            tree: tree,
            parentId: pid,
            initialValue: initValue,
            onAdd(concept) {
                if(!can('thesaurus_create')) return;

                addConcept(concept, tree, pid).then(_ => {
                    modal.destroy();
                });
            },
            onCancel(e) {
                modal.destroy();
            }
        },
    });
    modal.open();
}

export function showDeleteConcept(tree, conceptId) {
    const uid = `DeleteConcept-${getTs()}`;
    const modal = useModal({
        component: DeleteConcept,
        attrs: {
            name: uid,
            tree: tree,
            conceptId: conceptId,
            onConfirm(e) {
                if(!can('thesaurus_delete')) return;

                deleteConcept(e.nid, tree, e.action, e.params).then(_ => {
                    modal.destroy();
                });
            },
            onCancel(e) {
                modal.destroy();
            }
        },
    });
    modal.open();
}

export function showAddLanguage() {
    const uid = `AddLanguage-${getTs()}`;
    const modal = useModal({
        component: AddLanguage,
        attrs: {
            name: uid,
            onAdd(e) {
                if(!can('thesaurus_create')) return;

                addLanguage(e).then(_ => {
                    modal.destroy();
                });
            },
            onCancel(e) {
                modal.destroy();
            }
        },
    });
    modal.open();
}

export function showDeleteLanguage(languageId) {
    const uid = `DeleteLanguage-${getTs()}`;
    const modal = useModal({
        component: DeleteLanguage,
        attrs: {
            name: uid,
            languageId: languageId,
            onDelete(e) {
                if(!can('thesaurus_delete')) return;

                deleteLanguage(languageId).then(_ => {
                    modal.destroy();
                });
            },
            onCancel(e) {
                modal.destroy();
            }
        },
    });
    modal.open();
}
