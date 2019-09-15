(function(module) {
    module.component('appLocalList', {
        templateUrl: 'static/html/app-local-list.component.html',
        controller: function($scope, utils) {
            let self = this;

            this.$onInit = function() {
                self.localList = utils.Player.getSongList('localList');
            };

            $scope.$on('changeLocalList', function() {
                self.favoriteList = utils.Player.getSongList('localList');
                if (utils.Player.getPlayListType() === 'localList') {
                    $scope.$broadcast('changePlayList', self.favoriteList);
                }
            });

            /**
             * 更新angular界面
             */
            this.setState = function(fn) {
                let phase = $scope.$root.$$phase;
                if (phase === '$apply' || phase === '$digest') {
                    if (typeof fn === 'function') {
                        fn();
                    }
                } else {
                    $scope.$apply((typeof fn === 'function') && fn || angular.noop);
                }
            };
        }
    });
} ($module));
