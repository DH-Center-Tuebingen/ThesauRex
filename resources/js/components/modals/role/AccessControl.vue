<template>
    <vue-final-modal
        class="modal-container modal"
        name="access-control-modal">
        <div class="sp-modal-content">

            <div class="modal-header">
                <h5 class="modal-title">
                    {{ t('settings.role.permissions.access_control_title') }}
                    <small>
                        {{ state.role.display_name }}
                    </small>
                </h5>
                <button type="button" class="btn-close" aria-label="Close" data-bs-dismiss="modal" @click="closeModal()">
                </button>
            </div>
            <div class="modal-body">
                <div class="d-flex flex-column gap-2 align-items-start" v-if="state.isDerived">
                    <div class="d-flex flex-row align-items-center gap-2">
                        <span class="text-muted">
                            {{ t('settings.role.preset.derived_from') }}
                        </span>
                        <span class="badge bg-primary">
                            <i class="fas fa-fw fa-shield-alt"></i>
                            {{ t(`settings.role.preset.${state.role.derived.name}`) }}
                            <a href="#" class="text-decoration-none text-reset" @click.prevent="resetToPreset()" :title="`Reset role to preset`" v-if="state.differsFromPreset">
                                |
                                <i class="fas fa-fw fa-undo"></i>
                            </a>
                        </span>
                    </div>
                </div>
                <table class="table table-small table-hover table-striped text-center" v-if="state.permissionsLoaded">
                    <thead class="text-muted">
                        <tr>
                            <th></th>
                            <th class="fw-normal">
                                {{ t('settings.role.permissions.types.read') }}
                            </th>
                            <th class="fw-normal" :title="`* ${t('settings.role.permissions.types.write_info')}`">
                                {{ t('settings.role.permissions.types.write') }}
                                <span class="text-danger">*</span>
                            </th>
                            <th class="fw-normal" :title="`* ${t('settings.role.permissions.types.create_info')}`">
                                {{ t('settings.role.permissions.types.create') }}
                                <span class="text-danger">*</span>
                            </th>
                            <th class="fw-normal">
                                {{ t('settings.role.permissions.types.delete') }}
                            </th>
                            <th class="fw-normal" :title="`* ${t('settings.role.permissions.types.share_info')}`">
                                {{ t('settings.role.permissions.types.share') }}
                                <span class="text-danger">*</span>
                            </th>
                            <th class="fw-normal">
                                {{ t('global.select_all') }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(pg, i) in state.permissionGroups" :key="i">
                            <td class="text-start">
                                {{ t(`settings.role.permissions.groups.${pg}`) }}
                            </td>
                            <td>
                                <a href="#" class="text-reset text-decoration-none" @click.prevent="changePermissionState(pg, 'read')">
                                    <acl-state :status="state.permissionStates[pg].read" />
                                </a>
                            </td>
                            <td>
                                <a href="#" class="text-reset text-decoration-none" @click.prevent="changePermissionState(pg, 'write')">
                                    <acl-state :status="state.permissionStates[pg].write" />
                                </a>
                            </td>
                            <td>
                                <a href="#" class="text-reset text-decoration-none" @click.prevent="changePermissionState(pg, 'create')">
                                    <acl-state :status="state.permissionStates[pg].create" />
                                </a>
                            </td>
                            <td>
                                <a href="#" class="text-reset text-decoration-none" @click.prevent="changePermissionState(pg, 'delete')">
                                    <acl-state :status="state.permissionStates[pg].delete" />
                                </a>
                            </td>
                            <td>
                                <a href="#" class="text-reset text-decoration-none" @click.prevent="changePermissionState(pg, 'share')">
                                    <acl-state :status="state.permissionStates[pg].share" />
                                </a>
                            </td>
                            <td>
                                <a href="#" class="text-reset text-decoration-none" @click.prevent="changePermissionState(pg, 'all')">
                                    <acl-state :status="allState(pg)" />
                                </a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="modal-footer">
                <button type="submit" class="btn btn-outline-success" @click="savePermissions()">
                    <i class="fas fa-fw fa-save"></i> {{ t('global.save') }}
                </button>
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" @click="closeModal()">
                    <i class="fas fa-fw fa-times"></i> {{ t('global.close') }}
                </button>
            </div>
        </div>
    </vue-final-modal>
</template>

<script>
    import {
        computed,
        onMounted,
        reactive,
        toRefs,
        watch,
    } from 'vue';

    import { useI18n } from 'vue-i18n';

    import store from '@/bootstrap/store.js';

    import AccessControlState from '@/components/role/AccessControlState.vue';

    import {
        getRoleBy,
    } from '@/helpers/helpers.js';

    import {
        getAccessGroups,
    } from '@/helpers/accesscontrol.js';

    export default {
        props: {
            roleId: {
                type: Number,
                required: true,
            }
        },
        components: {
            'acl-state': AccessControlState,
        },
        emits: ['save', 'cancel'],
        setup(props, context) {
            const { t } = useI18n();
            const {
                roleId,
            } = toRefs(props);

            // FUNCTIONS
            const loadRolePermissions = permissions => {
                if(permissions.length === 0) return;

                // simple check whether this is an array of objects or strings
                const isObject = (typeof permissions[0]) != 'string';
                // we only need names
                const givenPermNames = isObject ? permissions.map(p => p.name) : permissions;

                state.permissionGroups.forEach(pg => {
                    state.permissionStates[pg] = {
                        read: givenPermNames.some(p => p == `${pg}_read`) ? 1 : 0,
                        write: givenPermNames.some(p => p == `${pg}_write`) ? 1 : 0,
                        create: givenPermNames.some(p => p == `${pg}_create`) ? 1 : 0,
                        delete: givenPermNames.some(p => p == `${pg}_delete`) ? 1 : 0,
                        share: givenPermNames.some(p => p == `${pg}_share`) ? 1 : 0,
                    };
                });
            };
            const allState = group => {
                let stateCnt = 0;
                for(let k in state.permissionStates[group]) {
                    if(state.permissionStates[group][k] === 1) {
                        stateCnt++;
                    }
                }

                if(stateCnt == 0) {
                    return 0;
                } else if(stateCnt == Object.keys(state.permissionStates[group]).length) {
                    return 1;
                } else {
                    return 2;
                }
            };
            const changePermissionState = (group, action) => {
                if(action == 'all') {
                    const newState = (allState(group) + 1) % 2;
                    for(let k in state.permissionStates[group]) {
                        state.permissionStates[group][k] = newState;
                    }
                } else {
                    state.permissionStates[group][action] = (state.permissionStates[group][action] + 1) % 2;
                }
            };
            const resetToPreset = _ => {
                if(!state.isDerived) return;

                const preset = store.getters.rolePresets.find(rp => rp.name == state.role.derived.name);

                if(!preset) return;

                loadRolePermissions(preset.fullSet);
            };
            const closeModal = _ => {
                context.emit('cancel', false);
            };
            const savePermissions = _ => {
                const permissions = [];
                for(let k in state.permissionStates) {
                    const set = state.permissionStates[k];

                    for(let l in set) {
                        const state = set[l];
                        if(state == 1) {
                            permissions.push(`${k}_${l}`);
                        }
                    }
                }
                context.emit('save', permissions);
            };

            // DATA
            const state = reactive({
                permissionsLoaded: false,
                role: computed(_ => getRoleBy(roleId.value, 'id', true) || {}),
                permissionStates: {},
                permissionGroups: null,
                isDerived: computed(_ => state.role.derived),
                differsFromPreset: computed(_ => {
                    if(!state.isDerived) return false;

                    // state.role.derived.name
                    const preset = store.getters.rolePresets.find(rp => rp.name == state.role.derived.name);
                    if(!preset) return false;

                    const presetPerms = preset.fullSet;
                    presetPerms.sort();
                    const rolePerms = state.role.permissions.map(p => p.name);
                    rolePerms.sort();

                    return presetPerms.length != rolePerms.length || presetPerms.join() != rolePerms.join();
                }),
            });

            // ON MOUNTED
            onMounted(async _ => {
                state.permissionGroups = await getAccessGroups();
                loadRolePermissions(state.role.permissions);
                state.permissionsLoaded = true;
            });

            // WATCHER
            watch(_ => state.role.permissions, (newValue) => {
                loadRolePermissions(state.role.permissions);
            });

            // RETURN
            return {
                t,
                // HELPERS
                // PROPS
                // LOCAL
                changePermissionState,
                allState,
                resetToPreset,
                closeModal,
                savePermissions,
                // STATE
                state,
            }
        },
    }
</script>
