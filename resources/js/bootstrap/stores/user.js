import {
    defineStore,
} from 'pinia';

import {
    addRole,
    addUser,
    // confirmUserPassword,
    deactivateUser,
    deleteRole,
    deleteUserAvatar,
    getCsrfCookie,
    login,
    logout,
    patchUserData,
    patchRoleData,
    reactivateUser,
    setUserAvatar,
} from '@/api.js';

import {
    only,
} from '@/helpers/helpers.js';

import useSystemStore from './system.js';

const updateUserAt = (context, userId, data, isProfile) => {
    const idx = context.users.findIndex(u => u.id == userId);
    if(idx > -1) {
        let allowedProps = [
            "email",
            "roles",
            "updated_at",
            "deleted_at",
        ];
        if(isProfile) {
            allowedProps.push(
                'nickname',
                'metadata',
                'avatar',
            );
        }

        const cleanData = only(data, allowedProps);
        const currentData = context.users[idx];

        context.users[idx] = {
            ...currentData,
            ...cleanData,
        };

        if(context.getCurrentUserId == userId) {
            context.setActiveUser(context.users[idx], true);
        }
    }
};

export const useUserStore = defineStore('user', {
    state: _ => ({
        userLoggedIn: false,
        user: {},
        users: [],
        deletedUsers: [],
        roles: [],
        permissions: [],
        rolePresets: [],
        preferences: {},
    }),
    getters: {
        isSameUser: state => userId => {
            return state.user.id == userId;
        },
        getPreferenceByKey: state => key => {
            return state.preferences[key];
        },
        getAllUsers: state => {
            return [
                ...state.users,
                ...state.deletedUsers,
            ];
        },
        getCurrentUser(state) {
            return state.user;
        },
        getCurrentUserId(state) {
            return this.getCurrentUser?.id;
        },
        getUserBy(state) {
            return (value, prop = 'id') => {
                if(!value) return null;

                if(state.userLoggedIn) {
                    const isNum = !isNaN(value);
                    const lValue = isNum ? value : value.toLowerCase();
                    if(prop == 'id' && value == state.user?.id) {
                        return state.user;
                    } else {
                        return state.users
                            .find(u => isNum ? (u[prop] == lValue) : (u[prop].toLowerCase() == lValue));
                    }
                } else {
                    return null;
                }
            };
        },
        getRoles: state => excludePermissions => {
            return excludePermissions ? state.roles.map(r => {
                // Remove permissions from role
                let {permissions, ...role} = r;
                return role;
            }) : state.roles;
        },
        getRoleBy(state) {
            return (value, prop = 'id', withPermissions = false) => {
                if(this.userLoggedIn) {
                    const isNum = !isNaN(value);
                    const lValue = isNum ? value : value.toLowerCase();
                    return this.getRoles(!withPermissions)
                        .find(r => isNum ? (r[prop] == lValue) : (r[prop].toLowerCase() == lValue));
                } else {
                    return null;
                }
            };
        },
    },
    actions: {
        setLoginState(value) {
            this.userLoggedIn = value;
        },
        setPreferences(preferences) {
            this.preferences = preferences;
        },
        async login(credentials) {
            await getCsrfCookie();
            const user = await login(credentials);
            this.userLoggedIn = true;
            this.setActiveUser(user);
            await useSystemStore().initialize();
        },
        async logout() {
            await logout();
            this.setLoginState(false);
            this.setActiveUser({});
        },
        setActiveUser(user, merge = false) {
            if(merge) {
                this.user = {
                    ...this.user,
                    ...user,
                };
            } else {
                this.user = user;
            }
        },
        setUsers(users, deletedUsers) {
            this.users = users;
            this.deletedUsers = deletedUsers || [];
        },
        setRoles(roles, permissions, presets) {
            this.roles = roles;
            this.permissions = permissions;
            this.rolePresets = presets;
        },
        async addUser(data) {
            return addUser(data).then(user => {
                this.users.push(user);
                return user;
            }).catch(e => {
                throw e;
            });
        },
        async deactivateUser(userId) {
            return deactivateUser(userId).then(data => {
                const index = this.users.findIndex(u => u.id == data.id);
                if(index > -1) {
                    const delUser = this.users.splice(index, 1)[0];
                    delUser.deleted_at = data.deleted_at;
                    this.deletedUsers.push(delUser);
                }
                return data;
            });
        },
        async reactivateUser(userId) {
            return reactivateUser(userId).then(_ => {
                const index = this.deletedUsers.findIndex(u => u.id == userId);
                if(index > -1) {
                    const reacUser = this.deletedUsers.splice(index, 1)[0];
                    this.users.push(reacUser);
                }
            });
        },
        async updateUser(userId, userData, isProfile) {
            return await patchUserData(userId, userData).then(data => {
                updateUserAt(this, userId, userData, isProfile);
                return data;
            }).catch(e => {
                throw e;
            });
        },
        async confirmOrUpdatePassword(userId, password) {
            return confirmUserPassword(userId, password).then(_ => {
                updateUserAt(this, userId, {
                    login_attempts: null,
                });
            });
        },
        async setAvatar(file) {
            const user = this.getCurrentUser;
            const filepath = user.avatar;
            return setUserAvatar(file).then(data => {
                const updateData = {
                    avatar: data.avatar,
                };
                // Workaround to update avatar image, because url may not change
                if(filepath == data.avatar) {
                    // TODO fix!
                    updateData.avatar += `#${Date.now()}`;
                }
                return updateUserAt(this, user.id, updateData, true);
            });
        },
        async deleteAvatar() {
            return deleteUserAvatar().then(_ => {
                const updateData = {
                    avatar: false,
                };
                return updateUserAt(this, this.getCurrentUserId, updateData, true);
            });
        },
        async addRole(data) {
            return addRole(data).then(role => {
                this.roles.push(role);
                return role;
            }).catch(e => {
                throw e;
            });
        },
        async updateRole(id, roleData) {
            return patchRoleData(id, roleData).then(data => {
                const idx = state.roles.findIndex(role => role.id == id);
                if(idx > -1) {
                    const cleanData = only(data, ['display_name', 'description', 'permissions', 'updated_at', 'deleted_at']);
                    const currentData = this.roles[idx];
                    this.roles[idx] = {
                        ...currentData,
                        ...cleanData,
                    };
                }
                return data;
            });
        },
        async deleteRole(role) {
            deleteRole(role.id).then(_ => {
                const idx = this.roles.findIndex(r => r.id == role.id);
                if(idx > -1) {
                    this.roles.splice(idx, 1);
                }
            });
        },
    },
});

export default useUserStore;
