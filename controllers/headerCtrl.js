spacialistApp.controller('headerCtrl', function($scope, $location, $route, $routeParams, scopeService) {
    if(typeof $routeParams.activeRole !== 'undefined') {
        if(scopeService.user.roles.indexOf($routeParams.activeRole) !== -1) {
            scopeService.user.activeRole = $routeParams.activeRole;
        } else {
            scopeService.user.activeRole = scopeService.user.roles[0];
        }
        $location.path("/");
    }
    $scope.scopeService = scopeService;
    $scope.isActive = function(currentLoc) {
        return currentLoc === $location.path();
    };
    $scope.isCollapsed = true;
});
