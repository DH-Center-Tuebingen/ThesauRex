spacialistApp.controller('LangCtrl', function($scope, $translate) {
        $scope.switchLang = function(key) {
            $translate.use(key);
        };
        $scope.langSet = function(lang) {
            var currLang = $translate.use();
            if(typeof currLang === 'undefined') return false;
            return currLang.startsWith(lang); // 'de_DE'.startsWith('de')
        };
});
