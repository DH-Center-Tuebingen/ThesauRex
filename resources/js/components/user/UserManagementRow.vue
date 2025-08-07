<template>
    <tr class="align-middle">
        <td>
            <a
                href="#"
                @click.prevent="showUserInfo(user)"
                class="text-nowrap text-reset text-decoration-none"
            >
                <user-avatar
                    class="align-middle"
                    :user="user"
                    :size="20"
                ></user-avatar>
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
                :class="getClassByValidation(emailErrors)"
                :name="`email_${user.id}`"
                :disabled="inputDisabled"
                v-model="emailValue"
                @input="emailHandleChange"
            />

            <div class="invalid-feedback">
                <span
                    v-for="(msg, i) in emailErrors"
                    :key="i"
                >
                    {{ msg }}
                </span>
            </div>
        </td>
        <td>

            <multiselect
                v-model="roleValue"
                :class="getClassByValidation(roleErrors)"
                :classes="classes"
                :name="`roles_${user.id}`"
                :object="true"
                :append-to-body="true"
                :label="'display_name'"
                :track-by="'display_name'"
                :valueProp="'id'"
                :mode="'tags'"
                :disabled="inputDisabled || !can('users_roles_write')"
                :options="userStore.getRoles(true)"
                :placeholder="t('settings.user.add_role_placeholder')"
                @input="roleHandleChange"
            >
            </multiselect>

            <div class="invalid-feedback">
                <span
                    v-for="(msg, i) in roleErrors"
                    :key="i"
                >
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
                <span
                    :id="`user-options-dropdown-${user.id}`"
                    class="clickable"
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                >
                    <i class="fas fa-fw fa-ellipsis-h"></i>
                    <sup
                        class="notification-info"
                        v-if="isDirty"
                    >
                        <i class="fas fa-fw fa-xs fa-circle text-warning"></i>
                    </sup>
                </span>
                <div
                    class="dropdown-menu"
                    :aria-labelledby="`user-options-dropdown-${user.id}`"
                >
                    <template v-if="!deactivated">
                        <a
                            v-if="isDirty"
                            class="dropdown-item"
                            :class="{
                                'disabled': !can('users_roles_write') || !isDirty || !isValid
                            }"
                            href="#"
                            @click.prevent="patchUser()"
                            data-action="save"
                        >
                            <i class="fas fa-fw fa-check text-success"></i> {{ t('global.save') }}
                        </a>
                        <a
                            class="dropdown-item"
                            href="#"
                            v-if="isDirty"
                            @click.prevent="resetUser()"
                            data-action="reset"
                        >
                            <i class="fas fa-fw fa-undo text-warning"></i> {{ t('global.reset') }}
                        </a>
                        <!-- <a class="dropdown-item" href="#" :disabled="state.currentUserId != user.id && !can('users_roles_write')" @click.prevent="updatePassword(user.email)">
                                        <i class="fas fa-fw fa-paper-plane text-info"></i> {{ t('global.send_reset_mail') }}
                                    </a> -->
                        <a
                            class="dropdown-item"
                            href="#"
                            :disabled="!can('users_roles_delete')"
                            @click.prevent="() => showDeactivateUser(user)"
                            data-action="deactivate"
                        >
                            <i class="fas fa-fw fa-user-times text-danger"></i> {{ t('global.deactivate') }}
                        </a>
                    </template>
                    <a
                        v-else
                        class="dropdown-item"
                        href="#"
                        :disabled="!can('users_roles_delete')"
                        @click.prevent="_ => userStore.reactivateUser(user.id)"
                        data-action="reactivate"
                    >
                        <i class="fas fa-fw fa-user-check text-success"></i> {{ t('global.reactivate')
                        }}
                    </a>

                </div>
            </div>
        </td>
    </tr>
</template>

<script>
    import * as yup from 'yup';
    import { useField } from 'vee-validate';
    import { computed, reactive } from 'vue';
    import { useI18n } from 'vue-i18n';

    import {
        date,
    } from '@/helpers/filters.js';

    import {
        can,
        getClassByValidation,
        getErrorMessages,
    } from '@/helpers/helpers.js';

    import {
        showDeactivateUser,
        showUserInfo,
    } from '@/helpers/modal.js';

    import { useToast } from '@/plugins/toast.js';
    import useUserStore from '@/bootstrap/stores/user.js';

    export default {
        props: {
            user: {
                type: Object,
                required: true
            },
            deactivated: {
                type: Boolean,
                default: false
            }
        },
        setup(props) {

            const userStore = useUserStore();
            const toast = useToast();
            const { t } = useI18n();

            const {
                errors: emailErrors,
                meta: emailMeta,
                value: emailValue,
                handleChange: emailHandleChange,
                resetField: emailResetField,
            } = useField(`email`, yup.string().required().email(), {
                initialValue: props.user?.email,
            });

            const {
                errors: roleErrors,
                meta: roleMeta,
                value: roleValue,
                handleChange: roleHandleChange,
                resetField: roleResetField,
            } = useField(`roles`, yup.array(), {
                initialValue: props.user?.roles,
            });

            const resetUser = id => {
                emailResetField();
                roleResetField();
                state.errors[id] = {};
            };

            const resetUserMeta = user => {
                emailResetField({ value: user.email });
                roleResetField({ value: user.roles });
            };

            const patchUser = async _ => {
                if(!props.user?.id) {
                    throw new Error('Missing user id');
                }

                if(!isDirty || !can('users_roles_write')) {
                    return;
                }

                const data = {};

                if(roleMeta.dirty) {
                    data.roles = roleValue.value.map(r => r.id);
                }
                if(emailMeta.dirty) {
                    data.email = emailValue.value;
                }

                try {
                    const updatedUser = await userStore.updateUser(props.user.id, data, false)
                    state.errors = {};
                    resetUserMeta(updatedUser);
                    const msg = t('settings.user.toasts.updated.msg', {
                        name: updatedUser.name
                    });
                    const title = t('settings.user.toasts.updated.title');
                    toast.$toast(msg, title, {
                        channel: 'success',
                    });
                } catch(e) {
                    state.errors = getErrorMessages(e);
                    throw e;
                }

            };

            const state = reactive({
                errors: []
            })

            const isDirty = computed(() => {
                return emailMeta.dirty || roleMeta.dirty;
            });

            const isValid = computed(() => {
                return emailMeta.valid && roleMeta.valid;
            });

            const errors = computed(() => {
                return [
                    ...state.errors,
                    ...emailErrors.value,
                    ...roleErrors.value,
                ];
            });

            const inputDisabled = computed(() => {
                return props.deactivated;
            });

            //// Currently the reset password is not not supported via email.
            // const updatePassword = email => {
            //     if(!can('users_roles_write')) return;
            //     userStore.requestPasswordResetFor(email);
            // };
            
            const classes = computed(() => {
                return {
                    dropdown: `multiselect-dropdown multiselect-dropdown-for-user-${props.user.id}`,
                };
            });

            return {
                t,
                can,
                classes,
                date,
                getClassByValidation,
                inputDisabled,
                patchUser,
                resetUser,
                showDeactivateUser,
                showUserInfo,
                userStore,
                //Exposed
                isDirty,
                isValid,
                errors,
                //Vee: Mail
                emailErrors,
                emailValue,
                emailHandleChange,
                // Vee: Roles
                roleErrors,
                roleValue,
                roleHandleChange,
            }
        }
    }
</script>