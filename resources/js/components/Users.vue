<template>
    <div class="d-flex flex-column h-100">
        <h4 class="d-flex flex-row gap-2 align-items-center">
            {{ t('settings.user.active_users') }}
            <button
                type="button"
                class="btn btn-outline-success btn-sm"
                @click="showNewUserModal()"
                :disabled="!can('thesaurus_create')"
            >
                <i class="fas fa-fw fa-plus"></i> {{ t('settings.user.add_button') }}
            </button>
        </h4>
        <div class="table-responsive flex-grow-1">
            <table
                id="active-users-table"
                class="table table-striped table-hover table-light"
                v-dcan="'users_roles_read'"
                v-if="state.dataInitialized"
            >
                <thead class="sticky-top">
                    <UserManagementRowHeader />
                </thead>
                <tbody>
                    <UserManagementRow
                        v-for="user in userStore.users"
                        :key="user.id"
                        :ref="(ref) => state.userRowRefs[user.id] = ref"
                        class="align-middle"
                        :user="user"
                        :id="`user-row-${user.id}`"
                    />
                </tbody>
            </table>
        </div>

        <hr>

        <h4>
            {{ t('settings.user.deactivated_users') }}
        </h4>
        <div
            class="table-responsive flex-grow-1"
            v-if="userStore.deletedUsers.length > 0"
        >
            <table
                id="deactivated-users-table"
                class="table table-striped table-hover table-light"
                v-dcan="'users_roles_read'"
            >
                <thead class="sticky-top">
                    <UserManagementRowHeader />
                </thead>
                <tbody>
                    <UserManagementRow
                        v-for="deactivatedUser in userStore.deletedUsers"
                        :key="deactivatedUser.id"
                        :user="deactivatedUser"
                        :deactivated="true"
                        :id="`user-row-${deactivatedUser.id}`"
                    />
                </tbody>
            </table>
        </div>
        <div
            class="alert alert-info"
            role="alert"
            v-else
        >
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
    import useUserStore from '@/bootstrap/stores/user.js';

    import {
        showDiscard,
        showAddUser,
        showUserInfo,
    } from '@/helpers/modal.js';

    import {
        can,
    } from '@/helpers/helpers.js';

    import {
        date,
    } from '@/helpers/filters.js';

    import UserManagementRow from './user/UserManagementRow.vue';
    import UserManagementRowHeader from './user/UserManagementRowHeader.vue';

    export default {
        components: {
            UserManagementRow,
            UserManagementRowHeader,
        },
        setup(props) {
            const { t } = useI18n();
            const userStore = useUserStore();


            const showNewUserModal = _ => {
                showAddUser();
            };

            const anyUserDirty = _ => {
                let isDirty = false;

                for(const userId in state.userRowRefs) {
                    const rowRef = state.userRowRefs[userId];
                    if(rowRef && rowRef.isDirty) {
                        isDirty = true;
                        break;
                    }
                }
                return isDirty;
            };
            // Used in Discard Modal to make all fields undirty
            const resetData = _ => {
                for(const userId in state.userRowRefs) {
                    const rowRef = state.userRowRefs[userId];
                    if(rowRef && rowRef.resetUser) {
                        rowRef.resetUser();
                    }
                }
            };
            // Used in Discard Modal to store data before moving on
            const onBeforeConfirm = async _ => {
                const promises = [];
                for(const userId in state.userRowRefs) {
                    const rowRef = state.userRowRefs[userId];
                    if(rowRef && rowRef.isDirty) {
                        promises.push(rowRef.patchUser());
                    }
                }

                // Throws an error if any patch fails
                await Promise.all(promises);
            };

            // DATA
            const state = reactive({
                dataInitialized: computed(_ => userStore.users.length > 0 && userStore.getRoles(true).length > 0),
                errors: {},
                userRowRefs: {},
            });
            const v = reactive({
                fields: {},
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
                // LOCAL
                showUserInfo,
                userStore,
                showNewUserModal,
                // PROPS
                // STATE
                state,
                v,
            }
        },
    }
</script>
