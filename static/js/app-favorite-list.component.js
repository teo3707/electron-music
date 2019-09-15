(function(module) {
    module.component('appFavoriteList', {
        templateUrl: 'static/html/app-favorite-list.component.html',
        controller: function($scope, utils) {
            let self = this;

            this.$onInit = function() {
                self.favoriteList = utils.Player.getSongList('favoriteList');
            };

            $scope.$on('changeFavoriteList', function() {
                self.favoriteList = utils.Player.getSongList('favoriteList');
                if (utils.Player.getPlayListType() === 'favoriteList') {
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
