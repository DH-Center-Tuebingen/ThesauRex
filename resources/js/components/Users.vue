<template>
    <div class="d-flex flex-column h-100" v-if="state.setupFinished">
        <h4 class="d-flex flex-row gap-2 align-items-center">
            {{ t('settings.user.active_users') }}
            <button type="button" class="btn btn-outline-success btn-sm" @click="showNewUserModal()" :disabled="!can('thesaurus_create')">
                <i class="fas fa-fw fa-plus"></i> {{ t('settings.user.add_button') }}
            </button>
        </h4>
        <div class="table-responsive flex-grow-1">
            <table class="table table-striped table-hover table-light" v-dcan="'users_roles_read'" v-if="state.dataInitialized">
                <thead class="sticky-top">
                    <tr>
                        <th>{{ t('global.name') }}</th>
                        <th>{{ t('global.email') }}</th>
                        <th>{{ t('global.roles') }}</th>
                        <th>{{ t('global.added_at') }}</th>
                        <th>{{ t('global.updated_at') }}</th>
                        <th>{{ t('global.options') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="user in state.userList" :key="user.id">
                        <td>
                            <a href="#" @click.prevent="showUserInfo(user)" class="text-nowrap text-reset text-decoration-none">
                                <user-avatar class="align-middle" :user="user" :size="20"></user-avatar>
                                <span class="align-middle ms-2">
                                    {{ user.name }} <span class="text-muted">{{ user.nickname }}</span>
                                </span>
                            </a>
                        </td>
                        <td>
                            <input
                                type="email"
                                class="form-control"
                                required
                                :class="getClassByValidation(getErrors(user.id, 'email'))"
                                :name="`email_${user.id}`"
                                v-model="v.fields[user.id].email.value"
                                @input="e => handleUserMailInput(e, user.id)" />

                            <div class="invalid-feedback">
                                <span v-for="(msg, i) in getErrors(user.id, 'email')" :key="i">
                                    {{ msg }}
                                </span>
                            </div>
                        </td>
                        <td>
                            <multiselect
                                v-model="v.fields[user.id].roles.value"
                                :class="getClassByValidation(getErrors(user.id, 'roles'))"
                                :name="`roles_${user.id}`"
                                :object="true"
                                :label="'display_name'"
                                :track-by="'display_name'"
                                :valueProp="'id'"
                                :mode="'tags'"
                                :disabled="!can('users_roles_write')"
                                :options="state.roles"
                                :placeholder="t('main.user.add_role_placeholder')"
                                @input="v.fields[user.id].roles.handleChange">
                            </multiselect>

                            <div class="invalid-feedback">
                                <span v-for="(msg, i) in getErrors(user.id, 'roles')" :key="i">
                                    {{ msg }}
                                </span>
                            </div>
                        </td>
                        <td>
                            {{ date(user.created_at) }}
                        </td>
                        <td>
                            {{ date(user.updated_at) }}
                        </td>
                        <td>
                            <div class="dropdown">
                                <span :id="`user-options-dropdown-${user.id}`" class="clickable" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <i class="fas fa-fw fa-ellipsis-h"></i>
                                    <sup class="notification-info" v-if="userDirty(user.id)">
                                        <i class="fas fa-fw fa-xs fa-circle text-warning"></i>
                                    </sup>
                                </span>
                                <div class="dropdown-menu" :aria-labelledby="`user-options-dropdown-${user.id}`">
                                    <a class="dropdown-item" href="#" v-if="userDirty(user.id)" :disabled="!userValid(user.id) || !can('users_roles_write')" @click.prevent="patchUser(user.id)">
                                        <i class="fas fa-fw fa-check text-success"></i> {{ t('global.save') }}
                                    </a>
                                    <a class="dropdown-item" href="#" v-if="userDirty(user.id)" @click.prevent="resetUser(user.id)">
                                        <i class="fas fa-fw fa-undo text-warning"></i> {{ t('global.reset') }}
                                    </a>
                                    <a class="dropdown-item" href="#" v-if="hasPreference('prefs.enable-password-reset-link')" :disabled="!can('users_roles_write')" @click.prevent="updatePassword(user.email)">
                                        <i class="fas fa-fw fa-paper-plane text-info"></i> {{ t('global.send_reset_mail') }}
                                    </a>
                                    <a class="dropdown-item" href="#" :disabled="!can('users_roles_delete')" @click.prevent="deactivateUser(user.id)">
                                        <i class="fas fa-fw fa-user-times text-danger"></i> {{ t('global.deactivate') }}
                                    </a>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <hr>

        <h4>
            {{ t('settings.user.deactivated_users') }}
        </h4>
        <div class="table-responsive flex-grow-1" v-if="state.deletedUserList.length > 0">
            <table class="table table-striped table-hover table-light" v-dcan="'users_roles_read'">
                <thead class="sticky-top">
                    <tr>
                        <th>{{ t('global.name') }}</th>
                        <th>{{ t('global.email') }}</th>
                        <th>{{ t('global.roles') }}</th>
                        <th>{{ t('global.added_at') }}</th>
                        <th>{{ t('global.updated_at') }}</th>
                        <th>{{ t('global.deactivated_at') }}</th>
                        <th>{{ t('global.options') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="dUser in state.deletedUserList" :key="dUser.id">
                        <td>
                            <a href="#" @click.prevent="showUserInfo(dUser)" class="text-nowrap text-reset text-decoration-none">
                                <user-avatar class="align-middle" :user="dUser" :size="20"></user-avatar>
                                <span class="align-middle ms-2">
                                    {{ dUser.name }} <span class="text-muted">{{ dUser.nickname }}</span>
                                </span>
                            </a>
                        </td>
                        <td>
                            {{ dUser.email }}
                        </td>
                        <td>
                            <multiselect
                                v-model="dUser.roles"
                                :name="`roles_${dUser.id}`"
                                :object="true"
                                :label="'display_name'"
                                :track-by="'display_name'"
                                :valueProp="'id'"
                                :mode="'tags'"
                                :disabled="true"
                                :options="[]"
                                :placeholder="t('settings.user.add_role_placeholder')">
                            </multiselect>
                        </td>
                        <td>
                            {{ date(dUser.created_at) }}
                        </td>
                        <td>
                            {{ date(dUser.updated_at) }}
                        </td>
                        <td>
                            {{ date(dUser.deleted_at) }}
                        </td>
                        <td>
                            <div class="dropdown">
                                <span :id="`deactive-user-dropdown-${dUser.id}`" class="clickable" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <i class="fas fa-fw fa-ellipsis-h"></i>
                                </span>
                                <div class="dropdown-menu" :aria-labelledby="`deactive-user-dropdown-${dUser.id}`">
                                    <a class="dropdown-item" href="#" :disabled="!can('users_roles_delete')" @click.prevent="reactivateUser(dUser.id)">
                                        <i class="fas fa-fw fa-user-check text-success"></i> {{ t('global.reactivate') }}
                                    </a>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="alert alert-info" role="alert" v-else>
            {{ t('settings.user.empty_list') }}
        </div>
    </div>
</template>

<script>
    import {
        computed,
        onMounted,
        reactive,
        watch,
    } from 'vue';

    import { onBeforeRouteLeave } from 'vue-router';
    import { useI18n } from 'vue-i18n';
    import { useField } from 'vee-validate';

    import * as yup from 'yup';

    import store from '@/bootstrap/store.js';

    import { useToast } from '@/plugins/toast.js';

    import {
        reactivateUser as reactivateUserApi,
        sendResetPasswordMail,
        patchUserData,
    } from '@/api.js';

    import {
        showDiscard,
        showAddUser,
        showDeactivateUser,
        showUserInfo,
    } from '@/helpers/modal.js';

    import {
        can,
        getClassByValidation,
        getErrorMessages,
        getUserBy,
        hasPreference,
    } from '@/helpers/helpers.js';

    import {
        date,
    } from '@/helpers/filters.js';

    export default {
        setup(props) {
            const { t } = useI18n();
            const toast = useToast();

            // FUNCTIONS
            const updateValidationState = users => {
                const currentIds = users.map(u => u.id);
                const oldIds = Object.keys(v.fields);

                for(let i=0; i<oldIds.length; i++) {
                    const oid = oldIds[i];

                    // Delete validation rules if user is deactivated
                    if(!currentIds.includes(oid) && !!v.fields[oid]) {
                        delete v.fields[oid];
                    }
                }

                for(let i=0; i<users.length; i++) {
                    const u = users[i];
                    // do not initialize existing users
                    if(!!v.fields[u.id]) continue;

                    const {
                        errors: em,
                        meta: mm,
                        value: vm,
                        handleChange: him,
                        resetField: hrm,
                    } = useField(`email_${u.id}`, yup.string().required().email(), {
                        initialValue: u.email,
                    });
                    const {
                        errors: er,
                        meta: mr,
                        value: vr,
                        handleChange: hir,
                        resetField: hrr,
                    } = useField(`roles_${u.id}`, yup.array(), {
                        initialValue: u.roles,
                    });
                    v.fields[u.id] = reactive({
                        email: {
                            errors: em,
                            meta: mm,
                            value: vm,
                            handleChange: him,
                            reset: hrm,
                        },
                        roles: {
                            errors: er,
                            meta: mr,
                            value: vr,
                            handleChange: hir,
                            reset: hrr,
                        },
                    });
                }
            };
            const userDirty = id => {
                return v.fields[id].email.meta.dirty || v.fields[id].roles.meta.dirty;
            };
            const userValid = id => {
                return v.fields[id].email.meta.valid && v.fields[id].roles.meta.valid;
            };
            const resetUser = id => {
                v.fields[id].email.reset();
                v.fields[id].roles.reset();
            };
            const resetUserMeta = id => {
                v.fields[id].email.reset({
                    value: v.fields[id].email.value,
                });
                v.fields[id].roles.reset({
                    value: v.fields[id].roles.value,
                });
            };
            const patchUser = async id => {
                if(!userDirty(id) || !userValid(id) || !can('users_roles_write')) {
                    return;
                }

                const user = getUserBy(id);
                const data = {};

                if(v.fields[id].roles.meta.dirty) {
                    data.roles = v.fields[id].roles.value.map(r => r.id);
                }
                if(v.fields[id].email.meta.dirty) {
                    data.email = v.fields[id].email.value;
                }

                return await patchUserData(id, data).then(data => {
                    state.errors[id] = {};
                    resetUserMeta(id);
                    store.dispatch('updateUser', {
                        id: data.id,
                        email: data.email,
                        roles: data.roles,
                        updated_at: data.updated_at,
                    });
                    const msg = t('settings.user.toasts.updated.msg', {
                        name: user.name
                    });
                    const title = t('settings.user.toasts.updated.title');
                    toast.$toast(msg, title, {
                        channel: 'success',
                    });
                }).catch(e => {
                    state.errors[id] = getErrorMessages(e);
                    throw e;
                });

            };
            const handleUserMailInput = (e, id) => {
                if(!!state.errors[id]) {
                    state.errors[id].email = [];
                }
                v.fields[id].email.handleChange(e);
            };
            const getErrors = (id, field) => {
                let apiErrors = [];
                if(!!state.errors[id] && !!state.errors[id][field]) {
                    apiErrors = state.errors[id][field];
                }
                const formErrors = v.fields[id] ? v.fields[id][field].errors : [];
                return [
                    ...formErrors,
                    ...apiErrors,
                ];
            };
            const showNewUserModal = _ => {
                showAddUser();
            };
            const deactivateUser = id => {
                if(!can('users_roles_delete')) return;
                showDeactivateUser(getUserBy(id));
            };
            const reactivateUser = id => {
                if(!can('users_roles_delete')) return;
                reactivateUserApi(id).then(_ => {
                    store.dispatch('reactivateUser', id);
                });
            };
            const updatePassword = email => {
                if(!can('users_roles_write')) return;
                sendResetPasswordMail(email);
            };
            const anyUserDirty = _ => {
                let isDirty = false;
                for(let i=0; i<state.userList.length; i++) {
                    const u = state.userList[i];
                    if(userDirty(u.id)) {
                        isDirty = true;
                        break;
                    }
                }
                return isDirty;
            };
            // Used in Discard Modal to make all fields undirty
            const resetData = _ => {
                for(let i=0; i<state.userList.length; i++) {
                    resetUser(state.userList[i].id);
                }
            };
            // Used in Discard Modal to store data before moving on
            const onBeforeConfirm = async _ => {
                for(let i=0; i<state.userList.length; i++) {
                    const uid = state.userList[i].id;
                    if(
                        (
                            !v.fields[uid].email.meta.dirty ||
                            (
                                v.fields[uid].email.meta.dirty &&
                                v.fields[uid].email.meta.valid
                            )
                        ) &&
                        (
                            !v.fields[uid].roles.meta.dirty ||
                            (
                                v.fields[uid].roles.meta.dirty &&
                                v.fields[uid].roles.meta.valid
                            )
                        )
                    ) {
                        await patchUser(uid);
                    }
                }
            };

            // DATA
            const state = reactive({
                setupFinished: false,
                userList: computed(_ => store.getters.users),
                deletedUserList: computed(_ => store.getters.deletedUsers),
                roles: computed(_ => store.getters.roles(true)),
                dataInitialized: computed(_ => state.userList.length > 0 && state.roles.length > 0),
                errors: {},
            });
            const v = reactive({
                fields: {},
            });

            // ON MOUNTED
            onMounted(_ => {
                updateValidationState(state.userList);
                state.setupFinished = true;
            })

            // WATCHER
            watch(_ => state.userList, (newValue) => {
                updateValidationState(newValue);
            });

            // ON BEFORE LEAVE
            onBeforeRouteLeave(async (to, from) => {
                if(anyUserDirty()) {
                    showDiscard(to, resetData, onBeforeConfirm);
                    return false;
                } else {
                    return true;
                }
            });

            // RETURN
            return {
                t,
                // HELPERS
                can,
                date,
                getClassByValidation,
                hasPreference,
                showUserInfo,
                // LOCAL
                userDirty,
                userValid,
                resetUser,
                patchUser,
                handleUserMailInput,
                getErrors,
                showNewUserModal,
                deactivateUser,
                reactivateUser,
                updatePassword,
                // PROPS
                // STATE
                state,
                v,
            }
        },
    }
</script>
