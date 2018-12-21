<template>
    <div>
        <table class="table table-striped table-hover" v-can="'view_users'">
            <thead class="thead-light">
                <tr>
                    <th>{{ $t('global.name') }}</th>
                    <th>{{ $t('global.email') }}</th>
                    <th>{{ $t('global.roles') }}</th>
                    <th>{{ $t('global.added-at') }}</th>
                    <th>{{ $t('global.updated-at') }}</th>
                    <th>{{ $t('global.options') }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="user in userList">
                    <td>
                        {{ user.name }}
                    </td>
                    <td>
                        <input type="email" class="form-control" :class="$getValidClass(error, `email_${user.id}`)" v-model="user.email" v-validate="" :name="`email_${user.id}`" />

                        <div class="invalid-feedback">
                            <span v-for="msg in error[`email_${user.id}`]">
                                {{ msg }}
                            </span>
                        </div>
                    </td>
                    <td>
                        <multiselect
                            label="display_name"
                            track-by="id"
                            v-model="user.roles"
                            v-validate=""
                            :closeOnSelect="false"
                            :disabled="!$can('add_remove_role')"
                            :hideSelected="true"
                            :multiple="true"
                            :name="`roles_${user.id}`"
                            :options="roles"
                            :placeholder="$t('settings.user.add-role-placeholder')"
                            :select-label="$t('global.select.select')"
                            :deselect-label="$t('global.select.deselect')">
                        </multiselect>
                    </td>
                    <td>
                        {{ user.created_at }}
                    </td>
                    <td>
                        {{ user.updated_at }}
                    </td>
                    <td>
                        <div class="dropdown">
                            <span id="dropdownMenuButton" class="clickable" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <i class="fas fa-fw fa-ellipsis-h"></i>
                                <sup class="notification-info" v-if="userDirty(user.id)">
                                    <i class="fas fa-fw fa-xs fa-circle text-warning"></i>
                                </sup>
                            </span>
                            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                <a class="dropdown-item" href="#" v-if="userDirty(user.id)" :disabled="!$can('add_remove_role')" @click.prevent="onPatchUser(user.id)">
                                    <i class="fas fa-fw fa-check text-success"></i> {{ $t('global.save') }}
                                </a>
                                <a class="dropdown-item" href="#" :disabled="!$can('change_password')" @click.prevent="updatePassword(user.id)">
                                    <i class="fas fa-fw fa-paper-plane text-info"></i> Send Reset-Mail
                                </a>
                                <a class="dropdown-item" href="#" :disabled="!$can('delete_users')" @click.prevent="requestDeleteUser(user.id)">
                                    <i class="fas fa-fw fa-trash text-danger"></i> {{ $t('global.delete') }}
                                </a>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <button type="button" class="btn btn-success" @click="showNewUserModal" :disabled="!$can('create_users')">
            <i class="fas fa-fw fa-plus"></i> {{ $t('settings.user.add-button') }}
        </button>

        <modal name="new-user-modal" height="auto" :scrollable="true">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ $t('settings.user.modal.new.title') }}</h5>
                    <button type="button" class="close" aria-label="Close" @click="hideNewUserModal">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="newUserForm" name="newUserForm" role="form" v-on:submit.prevent="onAddUser(newUser)">
                        <div class="form-group">
                            <label class="col-form-label col-md-3" for="name">
                                {{ $t('global.name') }}
                                <span class="text-danger">*</span>:
                            </label>
                            <div class="col-md-9">
                                <input class="form-control" :class="$getValidClass(error, 'name')" type="text" id="name" v-model="newUser.name" required />

                                <div class="invalid-feedback">
                                    <span v-for="msg in error.name">
                                        {{ msg }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-form-label col-md-4" for="display_name">
                                {{ $t('global.email') }}
                                <span class="text-danger">*</span>:
                            </label>
                            <div class="col-md-9">
                                <input class="form-control" :class="$getValidClass(error, 'email')" type="email" id="display_name" v-model="newUser.email" required />

                                <div class="invalid-feedback">
                                    <span v-for="msg in error.email">
                                        {{ msg }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-form-label col-md-3" for="description">
                                {{ $t('global.password') }}
                                <span class="text-danger">*</span>:
                            </label>
                            <div class="col-md-9">
                                <input class="form-control" :class="$getValidClass(error, 'password')" type="password" id="description" v-model="newUser.password" required />

                                <div class="invalid-feedback">
                                    <span v-for="msg in error.password">
                                        {{ msg }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-success" form="newUserForm">
                        <i class="fas fa-fw fa-plus"></i> {{ $t('global.add') }}
                    </button>
                    <button type="button" class="btn btn-danger"     @click="hideNewUserModal">
                        <i class="fas fa-fw fa-ban"></i> {{ $t('global.cancel') }}
                    </button>
                </div>
            </div>
        </modal>

        <modal name="confirm-delete-user-modal" height="auto" :scrollable="true">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ $t('global.delete_name.title', {name: selectedUser.name}) }}</h5>
                    <button type="button" class="close" aria-label="Close" @click="hideDeleteUserModal">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <span v-html="$t('global.delete_name.desc', {name: selectedUser.name})"></span>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-success" @click="deleteUser(selectedUser.id)">
                        <i class="fas fa-fw fa-check"></i> {{ $t('global.delete') }}
                    </button>
                    <button type="button" class="btn btn-danger" @click="hideDeleteUserModal">
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
            $httpQueue.add(() => $http.get('user').then(response => {
                const users = response.data.users;
                const roles = response.data.roles;
                next(vm => vm.init(users, roles));
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
                        await this.$asyncFor(this.userList, async u => {
                            await this.onPatchUser(u.id);
                        });
                        loadNext();
                    };
                    patching();
                };
                this.$modal.show(this.discardModal, {reference: this.$t('global.settings.users'), onDiscard: discardAndContinue, onSave: saveAndContinue, onCancel: _ => next(false)})
            } else {
                loadNext();
            }
        },
        mounted() {},
        methods: {
            init(users, roles) {
                this.userList = users;
                this.roles = roles;
            },
            showNewUserModal() {
                if(!this.$can('create_users')) return;
                this.$modal.show('new-user-modal');
            },
            hideNewUserModal() {
                this.$modal.hide('new-user-modal');
                this.newUser = {};
            },
            onAddUser(newUser) {
                if(!this.$can('create_users')) return;
                $http.post('user', newUser).then(response => {
                    this.userList.push(response.data);
                    this.hideNewUserModal();
                }).catch(e => {
                    this.$getErrorMessages(e, this.error);
                });
            },
            onPatchUser(id) {
                if(!this.$can('add_remove_role')) return new Promise(r => r());
                if(!this.userDirty(id)) return new Promise(r => r());
                let data = {};
                let user = this.userList.find(u => u.id == id);
                if(this.isDirty(`roles_${id}`)) {
                    let roles = [];
                    for(let i=0; i<user.roles.length; i++) {
                        roles.push(user.roles[i].id);
                    }
                    data.roles = roles;
                }
                if(this.isDirty(`email_${id}`)) {
                    data.email = user.email;
                }
                return $httpQueue.add(() => $http.patch(`user/${id}`, data).then(response => {
                    this.setUserPristine(id);
                    user.updated_at = response.data.updated_at;
                    this.$showToast(
                        this.$t('settings.user.toasts.updated.title'),
                        this.$t('settings.user.toasts.updated.msg', {
                            name: user.name
                        }),
                        'success'
                    );
                }).catch(e => {
                    this.$getErrorMessages(e, this.error, `_${id}`);
                }));
            },
            showDeleteUserModal() {
                if(!this.$can('delete_users')) return;
                this.$modal.show('confirm-delete-user-modal');
            },
            hideDeleteUserModal() {
                this.$modal.hide('confirm-delete-user-modal');
                this.selectedUser = {};
            },
            requestDeleteUser(id) {
                if(!this.$can('delete_users')) return;
                this.selectedUser = this.userList.find(u => u.id == id);
                this.showDeleteUserModal();
            },
            deleteUser(id) {
                const vm = this;
                if(!vm.$can('delete_users')) return;
                if(!id) return;
                vm.$http.delete(`user/${id}`).then(function(response) {
                    const index = vm.userList.findIndex(u => u.id == id);
                    if(index > -1) vm.userList.splice(index, 1);
                    vm.hideDeleteUserModal();
                });
            },
            updatePassword(id) {
                if(!vm.$can('change_password')) return;
            },
            isDirty(fieldname) {
                if(this.fields[fieldname]) {
                    return this.fields[fieldname].dirty;
                }
                return false;
            },
            userDirty(uid) {
                return this.isDirty(`roles_${uid}`) || this.isDirty(`email_${uid}`);
            },
            setPristine(fieldname) {
                this.$validator.flag(fieldname, {
                    dirty: false,
                    pristine: true
                });
            },
            setUserPristine(uid) {
                this.setPristine(`roles_${uid}`);
                this.setPristine(`email_${uid}`);
            }
        },
        data() {
            return {
                userList: [],
                roles: [],
                userRoles: {},
                newUser: {},
                error: {},
                selectedUser: {},
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
