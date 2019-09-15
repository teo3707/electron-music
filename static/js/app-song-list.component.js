(function(module) {
    module.component('appSongList', {
        templateUrl: 'static/html/app-song-list.component.html',
        bindings: {
            songList: '=?',
            listType: '@'
        },
        controller: function($scope, $location, utils) {
            let self = this;

            this.$onInit = function() {
                // 歌曲列表显示的字段
                this.fields = [
                    // 序号
                    {
                        label: '',
                        field: '',
                        flex: 1,
                    },
                    {
                        label: '音乐标题',
                        field: 'songName',
                        flex: 2,
                    },
                    {
                        label: '歌手',
                        field: 'author',
                        flex: 1,
                    },
                    {
                        label: '专辑',
                        field: 'albumName',
                        flex: 1,
                    },
                    {
                        label: '时长',
                        field: 'duration',
                        flex: 1,
                    },
                ];
                this.songList = this.songList || $location.__params.playList;
                this.listType = this.listType || $location.__params.listType;
                this.currentSong = utils.Player.getCurrentSong();
            };

            $scope.equals = utils.songEquils;

            /**
             * 通知播放器播放歌曲
             */
            this.playSong = function(song) {
                this.currentSong = song;
                $scope.$root.$broadcast('playSong', { song: song, listType: self.listType, playList: self.songList });
            }

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

            /**
             * 当切歌时，更新当前歌曲
             */
            $scope.$on('changeCurrentSong', function(_, song) {
                self.currentSong = song;
            });
        }
    });
} ($module));
