<template>
    <div>
        <table class="table table-striped table-hover">
            <thead class="thead-light">
                <tr>
                    <th>{{ $t('global.name') }}</th>
                    <th>{{ $t('global.display-name') }}</th>
                    <th>{{ $t('global.description') }}</th>
                    <th>{{ $t('global.permissions') }}</th>
                    <th>{{ $t('global.created-at') }}</th>
                    <th>{{ $t('global.updated-at') }}</th>
                    <th>{{ $t('global.options') }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="role in roleList">
                    <td>
                        {{ role.name }}
                    </td>
                    <td>
                        <input type="text" class="form-control" v-model="role.display_name" v-validate="" :name="`disp_${role.id}`" />
                    </td>
                    <td>
                        <input type="text" class="form-control" v-model="role.description" v-validate="" :name="`desc_${role.id}`" />
                    </td>
                    <td>
                        <multiselect
                            label="display_name"
                            track-by="id"
                            v-model="role.permissions"
                            v-validate=""
                            :closeOnSelect="false"
                            :disabled="!$can('add_remove_permission')"
                            :hideSelected="true"
                            :multiple="true"
                            :name="`perms_${role.id}`"
                            :options="permissions"
                            :placeholder="$t('settings.role.add-permission-placeholder')"
                            :select-label="$t('global.select.select')"
                            :deselect-label="$t('global.select.deselect')">
                        </multiselect>
                    </td>
                    <td>
                        {{ role.created_at }}
                    </td>
                    <td>
                        {{ role.updated_at }}
                    </td>
                    <td>
                        <div class="dropdown">
                            <span id="dropdownMenuButton" class="clickable" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <i class="fas fa-fw fa-ellipsis-h"></i>
                                <sup class="notification-info" v-if="roleDirty(role.id)">
                                    <i class="fas fa-fw fa-xs fa-circle text-warning"></i>
                                </sup>
                            </span>
                            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                <a class="dropdown-item" href="#" v-if="roleDirty(role.id)" :disabled="!$can('add_remove_permission')" @click.prevent="onPatchRole(role.id)">
                                    <i class="fas fa-fw fa-check text-success"></i> {{ $t('global.save') }}
                                </a>
                                <a class="dropdown-item" href="#" @click.prevent="requestDeleteRole(role.id)" :disabled="!$can('delete_role')">
                                    <i class="fas fa-fw fa-trash text-danger"></i> {{ $t('global.delete') }}
                                </a>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <button type="button" class="btn btn-success" @click="showNewRoleModal" :disabled="!$can('add_edit_role')">
            <i class="fas fa-fw fa-plus"></i> {{ $t('settings.role.add-button') }}
        </button>

        <modal name="new-role-modal" height="auto" :scrollable="true" v-can="'add_edit_role'">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="newRoleModalLabel">{{ $t('settings.role.modal.new.title') }}</h5>
                    <button type="button" class="close" aria-label="Close" @click="hideNewRoleModal">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="newRoleForm" name="newRoleForm" role="form" v-on:submit.prevent="onAddRole(newRole)">
                        <div class="form-group">
                            <label class="col-form-label col-md-3" for="name">
                                {{ $t('global.name') }}
                                <span class="text-danger">*</span>:
                            </label>
                            <div class="col-md-9">
                                <input class="form-control" :class="$getValidClass(error, 'name')" type="text" id="name" v-model="newRole.name" required autofocus />

                                <div class="invalid-feedback">
                                    <span v-for="msg in error.name">
                                        {{ msg }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-form-label col-md-3" for="display_name">
                                {{ $t('global.display-name') }}:
                            </label>
                            <div class="col-md-9">
                                <input class="form-control" type="text" id="display_name" v-model="newRole.display_name" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-form-label col-md-3" for="description">
                                {{ $t('global.description') }}:
                            </label>
                            <div class="col-md-9">
                                <input class="form-control" type="text" id="description" v-model="newRole.description" />
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-success" form="newRoleForm">
                        <i class="fas fa-fw fa-plus"></i> {{ $t('global.add') }}
                    </button>
                    <button type="button" class="btn btn-danger" @click="hideNewRoleModal">
                        <i class="fas fa-fw fa-ban"></i> {{ $t('global.cancel') }}
                    </button>
                </div>
            </div>
        </modal>

        <modal name="confirm-delete-role-modal" height="auto" :scrollable="true" v-can="'delete_role'">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ $t('global.delete-name.title', {name: selectedRole.display_name}) }}</h5>
                    <button type="button" class="close" aria-label="Close" @click="hideDeleteRoleModal">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    {{ $t('global.delete-name.desc', {name: selectedRole.display_name}) }}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-success" @click="deleteRole(selectedRole.id)">
                        <i class="fas fa-fw fa-check"></i> {{ $t('global.delete') }}
                    </button>
                    <button type="button" class="btn btn-danger" @click="hideDeleteRoleModal">
                        <i class="fas fa-fw fa-ban"></i> {{ $t('global.cancel') }}
                    </button>
                </div>
            </div>
        </modal>
        <discard-changes-modal :name="discardModal"/>
    </div>
</template>

<script>
    import { mapFields } from 'vee-validate';

    export default {
        beforeRouteEnter(to, from, next) {
            $httpQueue.add(() => $http.get('role').then(response => {
                const roles = response.data.roles;
                const permissions = response.data.permissions;
                next(vm => vm.init(roles, permissions));
            }));
        },
        beforeRouteLeave: function(to, from, next) {
            let loadNext = () => {
                next();
            }
            if(this.isOneDirty) {
                let discardAndContinue = () => {
                    loadNext();
                };
                let saveAndContinue = () => {
                    let patching = async _ => {
                        await this.$asyncFor(this.roleList, async r => {
                            await this.onPatchRole(r.id);
                        });
                        loadNext();
                    };
                    patching();
                };
                this.$modal.show(this.discardModal, {reference: this.$t('global.settings.roles'), onDiscard: discardAndContinue, onSave: saveAndContinue, onCancel: _ => next(false)})
            } else {
                loadNext();
            }
        },
        mounted() {},
        methods: {
            init(roles, permissions) {
                this.roleList = roles;
                this.permissions = permissions;
            },
            showNewRoleModal() {
                if(!this.$can('add_edit_role')) return;
                this.$modal.show('new-role-modal');
            },
            hideNewRoleModal() {
                this.$modal.hide('new-role-modal');
                this.newRole = {};
            },
            onAddRole(newRole) {
                const vm = this;
                if(!vm.$can('add_edit_role')) return;
                vm.$http.post('role', newRole).then(function(response) {
                    vm.roleList.push(response.data);
                    vm.hideNewRoleModal();
                }).catch(e => {
                    this.$getErrorMessages(e, this.error);
                });
            },
            onPatchRole(id) {
                if(!this.$can('add_edit_role')) return new Promise(r => r());
                if(!this.roleDirty(id)) return new Promise(r => r());
                let role = this.roleList.find(r => r.id == id);
                let data = {};
                if(this.isDirty(`perms_${id}`)) {
                    let permissions = [];
                    for(let i=0; i<role.permissions.length; i++) {
                        permissions.push(role.permissions[i].id);
                    }
                    data.permissions = permissions;
                }
                if(this.isDirty(`disp_${id}`)) {
                    data.display_name = role.display_name;
                }
                if(this.isDirty(`desc_${id}`)) {
                    data.description = role.description;
                }
                return $httpQueue.add(() => $http.patch(`role/${id}`, data).then(response => {
                    this.setRolePristine(id);
                    role.updated_at = response.data.updated_at;
                    this.$showToast(
                        this.$t('settings.role.toasts.updated.title'),
                        this.$t('settings.role.toasts.updated.msg', {
                            name: role.display_name
                        }),
                        'success'
                    );
                }));
            },
            showDeleteRoleModal() {
                if(!this.$can('delete_role')) return;
                this.$modal.show('confirm-delete-role-modal');
            },
            hideDeleteRoleModal() {
                this.$modal.hide('confirm-delete-role-modal');
                this.selectedRole = {};
            },
            requestDeleteRole(id) {
                if(!this.$can('delete_role')) return;
                this.selectedRole = this.roleList.find(r => r.id == id);
                this.showDeleteRoleModal();
            },
            deleteRole(id) {
                const vm = this;
                if(!vm.$can('delete_role')) return;
                if(!id) return;
                vm.$http.delete(`role/${id}`).then(function(response) {
                    const index = vm.roleList.findIndex(r => r.id == id);
                    if(index > -1) vm.roleList.splice(index, 1);
                    vm.hideDeleteRoleModal();
                });
            },
            isDirty(fieldname) {
                if(this.fields[fieldname]) {
                    return this.fields[fieldname].dirty;
                }
                return false;
            },
            roleDirty(rid) {
                return this.isDirty(`perms_${rid}`) || this.isDirty(`disp_${rid}`) || this.isDirty(`desc_${rid}`);
            },
            setPristine(fieldname) {
                this.$validator.flag(fieldname, {
                    dirty: false,
                    pristine: true
                });
            },
            setRolePristine(rid) {
                this.setPristine(`perms_${rid}`);
                this.setPristine(`disp_${rid}`);
                this.setPristine(`desc_${rid}`);
            }
        },
        data() {
            return {
                roleList: [],
                permissions: [],
                userRoles: {},
                newRole: {},
                error: {},
                selectedRole: {},
                discardModal: 'discard-changes-modal'
            }
        },
        computed: {
            isOneDirty() {
                return Object.keys(this.fields).some(key => this.fields[key].dirty);
            },
        }
    }
</script>
