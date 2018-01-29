thesaurexApp.controller('prefCtrl', ['$scope', 'userService', '$state', function($scope, userService, $state) {
    $scope.getPreferences = function() {
        var curr = $state.current.name;
        $scope.preferences = {};
        $scope.isUserPref = false;
        $scope.userId;
        if(curr == 'preferences') {
            userService.getPreferences().then(function(response) {
                for(var k in response) {
                    $scope.preferences[k] = response[k];
                }
            });
        } else if(curr == 'preferences.user') {
            var uid = userService.currentUser.user.id;
            userService.getUserPreferences(uid).then(function(response) {
                for(var k in response) {
                    if(!response[k].allow_override) continue;
                    $scope.preferences[k] = response[k];
                }
            });
            $scope.isUserPref = true;
            $scope.userId = uid;
        }
    };

    $scope.storePreference = function(pref) {
        if($scope.userid) {
            return userService.storeUserPreference(pref, $scope.userId);
        } else {
            return userService.storePreference(pref);
        }
    };
}]);
