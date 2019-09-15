(function(module) {
    /**
     * 关于界面
     */
    module.component('appAbout', {
        template: '<div>about<button ng-click="$ctrl.goHome()">home</button></div>',
        controller: function($window) {
            let self = this;
            self.goHome = function() {
                $window.history.back();
            }
        }
    });
} ($module));
