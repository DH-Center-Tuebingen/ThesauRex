thesaurexApp.service('userService', ['httpPostFactory', 'httpGetFactory', 'modalFactory', '$auth', '$state', '$http', function(httpPostFactory, httpGetFactory, modalFactory, $auth, $state, $http) {
    var user = {};
    user.currentUser = {
        permissions: {},
        roles: {},
        user: {}
    };
    user.loginError = {};
    user.users = [];
    user.roles = [];
    user.permissions = [];
    user.can = function(to) {
        if(typeof user.currentUser == 'undefined') return false;
        if(typeof user.currentUser.permissions[to] == 'undefined') return false;
        return user.currentUser.permissions[to] == 1;
    };

    user.getUserList = function() {
        user.users.length = 0;
        httpPostFactory('api/user/get/all', new FormData(), function(response) {
            angular.forEach(response.users, function(u, key) {
                user.users.push(u);
            });
        });
    };

    user.deleteUser = function(u) {
        console.log(u);
        httpGetFactory('api/user/delete/' + u.id, function(response) {
            var index = user.users.indexOf(u);
            if(index > -1) user.users.splice(index, 1);
        });
    };

    user.addUser = function(name, email, password) {
        var formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        httpPostFactory('api/user/add', formData, function(response) {
            user.users.push(response.user);
        });
    };

    user.editUser = function(changes, id, $index) {
        var formData = new FormData();
        formData.append('user_id', id);
        for(var k in changes) {
            if(changes.hasOwnProperty(k)) {
                formData.append(k, changes[k]);
            }
        }
        httpPostFactory('api/user/edit', formData, function(response) {
            user.users[$index] = response.user;
        });
    };

    user.getRoles = function() {
        user.roles.length = 0;
        user.permissions.length = 0;
        httpGetFactory('api/user/get/roles/all', function(response) {
            angular.forEach(response.permissions, function(perm) {
                user.permissions.push(perm);
            });
            angular.forEach(response.roles, function(role, key) {
                role.permissions = [];
                user.roles.push(role);
            });
        });
    };

    user.getRolePermissions = function(role) {
        if(role.permissions) role.permissions.length = 0;
        httpGetFactory('api/user/get/role/permissions/' + role.id, function(response) {
            angular.forEach(response.permissions, function(perm) {
                role.permissions.push(perm);
            });
        });
    };

    user.openEditRoleDialog = function(role) {
        modalFactory.editRoleModal(editRole, role);
    };

    function editRole(role, changes) {
        var formData = new FormData();
        if(role) formData.append('role_id', role.id);
        for(var k in changes) {
            if(changes.hasOwnProperty(k)) {
                formData.append(k, changes[k]);
            }
        }
        httpPostFactory('api/role/edit', formData, function(response) {
            var isNew = false;
            if(!role) {
                role = {};
                isNew = true;
            }
            for(var k in response.role) {
                if(response.role.hasOwnProperty(k)) {
                    role[k] = response.role[k];
                }
            }
            if(isNew) user.roles.push(role);
        });
    }

    user.deleteRole = function(role) {
        httpGetFactory('api/role/delete/' + role.id, function(response) {
            if(response.error) return;
            var index = user.roles.indexOf(role);
            if(index > -1) user.roles.splice(index, 1);
        });
    };

    user.addRolePermission = function(item, role) {
        var formData = new FormData();
        formData.append('role_id', role.id);
        formData.append('permission_id', item.id);
        httpPostFactory('api/role/add/permission', formData, function(response) {
            // if an error occurs, remove added permission
            if(response.error) {
                var index = role.permissions.indexOf(item);
                if(index > -1) role.permissions.splice(index, 1);
                return;
            }
        });
    };

    user.removeRolePermission = function(item, role) {
        var formData = new FormData();
        formData.append('role_id', role.id);
        formData.append('permission_id', item.id);
        httpPostFactory('api/role/remove/permission', formData, function(response) {
            // if an error occurs, readd removed permission
            if(response.error) {
                role.permissions.push(item);
                return;
            }
        });
    };

    user.getUserRoles = function(id, $index) {
        httpGetFactory('api/user/get/roles/' + id, function(response) {
            user.users[$index].roles = response.roles;
        });
    };

    user.addUserRole = function($item, user_id) {
        var formData = new FormData();
        formData.append('role_id', $item.id);
        formData.append('user_id', user_id);
        httpPostFactory('api/user/add/role', formData, function(response) {
            // TODO only remove/add role if function returns no error
        });
    };

    user.removeUserRole = function($item, user_id) {
        var formData = new FormData();
        formData.append('role_id', $item.id);
        formData.append('user_id', user_id);
        httpPostFactory('api/user/remove/role', formData, function(response) {
            // TODO only remove/add role if function returns no error
        });
    };

    user.loginUser = function(credentials) {
        $auth.login(credentials).then(function() {
            return $http.post('api/user/get');
        }).then(function(response) {
            if(typeof response === 'undefined' || response.status !== 200) {
                $state.go('auth', {});
                return;
            }
            localStorage.setItem('user', JSON.stringify(response.data));
            user.currentUser.user = response.data.user;
            user.currentUser.permissions = response.data.permissions;
            console.log(JSON.stringify(response.data));
            delete user.loginError.message;
            $state.go('thesaurex', {});
        });
    };

    user.logoutUser = function() {
        $auth.logout().then(function() {
            user.currentUser.user = {};
            user.currentUser.permissions = {};
            localStorage.removeItem('user');
            $state.go('auth', {});
        });
    };

    return user;
}]);
