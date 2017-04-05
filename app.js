var thesaurexApp = angular.module('tutorialApp', ['ngAnimate', 'satellizer', 'ui.router', 'ngRoute', 'ngMessages', 'nemLogging', 'ui.select', 'ngSanitize', 'ngFlag', 'ui.bootstrap', 'ngFileUpload', 'ui.tree', 'ui.bootstrap.contextMenu']);

thesaurexApp.directive('spinner', function() {
    return {
        template: '<div class="spinner-container">' +
            '<svg class="circle-img-path" viewBox="25 25 50 50">' +
                '<circle class="circle-path" cx="50" cy="50" r="20" fill="none" stroke-width="4" stroke-miterlimit="10" />' +
            '</svg>' +
        '</div>'
    };
});

thesaurexApp.controller('masterCtrl', ['$scope', function($scope) {
    $scope.treeName = 'master';
}]);

thesaurexApp.controller('projectCtrl', ['$scope', function($scope) {
    $scope.treeName = 'project';
}]);

thesaurexApp.service('modalFactory', ['$uibModal', function($uibModal) {
    this.deleteModal = function(elementName, onConfirm, additionalWarning) {
        if(typeof additionalWarning != 'undefined' && additionalWarning !== '') {
            var warning = additionalWarning;
        }
        var modalInstance = $uibModal.open({
            templateUrl: 'templates/delete-confirm.html',
            controller: function($uibModalInstance) {
                this.name = elementName;
                this.warning = warning;
                this.cancel = function(result) {
                    $uibModalInstance.dismiss('cancel');
                };
                this.deleteConfirmed = function() {
                    onConfirm();
                    $uibModalInstance.dismiss('ok');
                };
            },
            controllerAs: 'mc'
        });
        modalInstance.result.then(function(selectedItem) {}, function() {});
    };
    this.errorModal = function(msg) {
        var modalInstance = $uibModal.open({
            templateUrl: 'layouts/error.html',
            controller: function($uibModalInstance) {
                this.msg = msg;
                this.cancel = function(result) {
                    $uibModalInstance.dismiss('cancel');
                };
            },
            controllerAs: 'mc'
        });
        modalInstance.result.then(function(selectedItem) {}, function() {});
    };
}]);

thesaurexApp.directive('resizeWatcher', function($window) {
    return function($scope) {
        var bottomPadding = 20;
        var listPadding = 40;

        $scope.getWindowSize = function() {
            var height = $window.innerHeight;
            var width = $window.innerWidth;
            var isSm = window.matchMedia("(max-width: 991px)").matches;
            var controlElement = $('.control-elements')[0];
            var controlHeight;
            if(controlElement) controlHeight = controlElement.offsetHeight + controlElement.offsetTop;
            else controlHeight = 0;
            if(isSm) {
                $('#master-tree').css('height', '');
                $('#project-tree').css('height', '');
                $('#broader-list').css('height', '');
                $('#narrower-list').css('height', '');
                $('#preferred-list').css('height', '');
                $('#alternative-list').css('height', '');
            } else {
                var headerHeight = document.getElementById('main-container').offsetTop;
                var informationHeight = 0;
                var informationHeader = document.getElementById('information-header');
                if(informationHeader) informationHeight = informationHeader.offsetHeight;
                var informationAlertHeight = 0;
                var informationAlert = document.getElementById('information-alert');
                if(informationAlert) informationAlertHeight = informationAlert.offsetHeight;
                informationHeight += informationAlertHeight;
                //use broader-header height as subHeaderHeight, since all *-header should have the same height
                var subHeader = document.getElementById('broader-header');
                var subHeaderHeight = 0;
                if(subHeader) subHeaderHeight = subHeader.offsetHeight + subHeader.offsetTop;

                var containerHeight = height - controlHeight - headerHeight - bottomPadding;
                var rightHeight = height - headerHeight - (bottomPadding - (listPadding/4)) - informationHeight - listPadding;
                var labelHeight = (rightHeight - (2 * subHeaderHeight)) / 2;

                $('#master-tree').css('height', containerHeight);
                $('#project-tree').css('height', containerHeight);
                $('#broader-list').css('height', labelHeight);
                $('#narrower-list').css('height', labelHeight);
                $('#preferred-list').css('height', labelHeight);
                $('#alternative-list').css('height', labelHeight);
            }
        };

        //recalculate window size if information-alert gets toggled (and thus toggle information container as well)
        var alertElement = "#information-alert";
        $scope.$watch(function() {
            return angular.element(alertElement).is(':visible');
        }, function() {
            $scope.getWindowSize();
        });

        return angular.element($window).bind('resize', function() {
            $scope.getWindowSize();
            return $scope.$apply();
        });
    };
});

thesaurexApp.directive('myDirective', function(httpPostFactory, scopeService) {
    return {
        restrict: 'A',
        scope: false,
        link: function(scope, element, attr) {
            element.bind('change', function() {
                var formData = new FormData();
                formData.append('file', element[0].files[0]);
            });
        }
    };
});

thesaurexApp.directive('formField', function() {
    return {
        restrict: 'E',
        templateUrl: 'includes/inputFields.html',
        scope: {
            fields: '=',
            output: '='
        }
    };
});

thesaurexApp.directive("number", function() {
    return {
        restrict: "A",
        require: "ngModel",
        link: function(scope, element, attributes, ngModel) {
            ngModel.$validators.number = function(modelValue) {
                return isFinite(modelValue);
            };
        }
    };
});

thesaurexApp.filter('bytes', function() {
	return function(bytes, precision) {
        var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
		if(isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '0 ' + units[0];
		if(typeof precision === 'undefined') precision = 1;
		var number = Math.floor(Math.log(bytes) / Math.log(1024));
		return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
	};
});

thesaurexApp.filter('overallLength', function() {
    return function(obj) {
        var count = 0;
        angular.forEach(obj, function(value, key) {
            count += value.length;
        });
        return count;
    };
});

thesaurexApp.filter('truncate', function () {
    return function (value, max, atword, suffix) {
        if(!value) return '';
        if(!max || value.length <= max) return value;

        value = value.substr(0, max);
        if(atword) {
            var lastWordIndex = value.lastIndexOf(' ');
            if(lastWordIndex != -1) {
                if(value.endsWith(',', lastWordIndex) || value.endsWith('.', lastWordIndex)) lastWordIndex--;
                value = value.substr(0, lastWordIndex);
            }
        }
        return value + (suffix || '…');
    };
});

thesaurexApp.factory('httpPostPromise', function($http) {
    var getData = function(file, data) {
        return $http({
            url: file,
            method: "POST",
            data: data,
            headers: {
                'Content-Type': undefined
            }
        }).then(function(result) {
            return result.data;
        });
    };
    return { getData: getData };
});

thesaurexApp.factory('httpPostFactory', function($http) {
    return function(file, data, callback) {
        $http({
            url: file,
            method: "POST",
            data: data,
            headers: {
                'Content-Type': undefined
            }
        }).success(function(response) {
            callback(response);
        });
    };
});

thesaurexApp.factory('httpGetPromise', function($http) {
    var getData = function(file) {
        return $http({
            url: file,
            method: "GET",
            headers: {
                'Content-Type': undefined
            }
        }).then(function(result) {
            return result.data;
        });
    };
    return { getData: getData };
});

thesaurexApp.factory('httpGetFactory', function($http) {
    return function(file, callback) {
        $http({
            url: file,
            method: "GET",
            headers: {
                'Content-Type': undefined
            }
        }).success(function(response) {
            callback(response);
        });
    };
});

thesaurexApp.config(function($stateProvider, $urlRouterProvider, $authProvider, $httpProvider, $provide) {
    var lastError;
    var rejectReasons = [
        'user_not_found',
        'token_not_provided',
        'token_expired',
        'token_absent',
        'token_invalid'
    ];
    var rejectTranslationKeys = [
        "login.error.user-not-found",
        "login.error.token-not-provided",
        "login.error.token-expired",
        "login.error.token-absent",
        "login.error.token-invalid"
    ];

    function updateToken(response, $injector) {
        if(response.headers('Authorization') !== null) {
            var token = response.headers('Authorization').replace('Bearer ', '');
            var $auth = $injector.get('$auth');
            $auth.setToken(token);
            localStorage.setItem('satellizer_token', token);
        }
    }

    function setAuthHeader($q, $injector) {
        return {
            response: function(response) {
                updateToken(response, $injector);
                return response || $q.when(response);
            },
            responseError: function(rejection) {
                console.log("Something went wrong...");
                var reasonIndex = rejectReasons.indexOf(rejection.data.error);
                if(rejection.data && reasonIndex > -1) {
                    localStorage.removeItem('user');
                    var userService = $injector.get('userService');
                    userService.loginError.message = rejectTranslationKeys[reasonIndex];
                } else if(rejection.status == 400 || rejection.status == 401) {
                    var $state = $injector.get('$state');
                    var userService = $injector.get('userService');
                    userService.loginError.message = 'login.error.400-or-401';
                    localStorage.removeItem('user');
                    $state.go('auth');
                } else {
                    updateToken(rejection, $injector);
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(rejection.data, "text/xml");
                    var errors = doc.getElementsByClassName('exception_message');
                    var modalFactory = $injector.get('modalFactory');
                    var errorMsg;
                    if(typeof errors[0] != 'undefined' && errors[0].innerHTML) {
                        errorMsg = errors[0].innerHTML;
                    } else {
                        errorMsg = rejection.statusText;
                    }
                    if(!lastError || lastError != rejection.status) {
                        lastError = rejection.status;
                        modalFactory.errorModal(errorMsg);
                    }
                }
                return $q.reject(rejection);
            }
        };
    }
    $provide.factory('setAuthHeader', setAuthHeader);

    $httpProvider.interceptors.push('setAuthHeader');

	$authProvider.baseUrl = '.';
    $authProvider.loginUrl = 'api/user/login';
    $urlRouterProvider.otherwise('/auth');

    $stateProvider
        .state('auth', {
            url: '/auth',
            templateUrl: 'layouts/login.html',
            controller: 'userCtrl'
        })
        .state('thesaurex', {
            url: '/thesaurex',
            templateUrl: 'includes/tree.html'
        })
        .state('user', {
            url: '/user',
            templateUrl: 'user.html'
        })
        .state('roles', {
            url: '/roles',
            templateUrl: 'roles.html'
        });
});

/**
 * Redirect user to 'spacialist' state if they are already logged in and access the 'auth' state
 */
thesaurexApp.run(function($rootScope, $state, userService) {
    $rootScope.$on('$stateChangeStart', function(event, toState) {
        var user = localStorage.getItem('user');
        if(user !== '') {
            parsedUser = JSON.parse(user);
            if(parsedUser) {
                userService.currentUser.user = parsedUser.user;
                userService.currentUser.permissions = parsedUser.permissions;
                if(toState.name === 'auth') {
                    event.preventDefault();
                    $state.go('thesaurex');
                }
            }
        }
    });
});
