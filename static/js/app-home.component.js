(function(module) {
    /**
     * 主界面
     */
    module.component('appHome', {
        templateUrl: 'static/html/app-home.component.html',
        controller: function($scope, $route, $location, $http, $window, utils, clockTimeFilter) {
            let self = this;

            /**
             * 获取QQ音乐推荐歌单
             */
            this.$onInit = async function() {
                this.currentSong = utils.Player.getCurrentSong();
                this.playList = utils.Player.getPlayList();
                await this.getSongTypes();
                if (this.songTypes) {
                    for (let i = 0 ; i < this.songTypes.length; i++) {
                        this.searchSongByType(this.songTypes[i]);
                    }
                }
            }

            /**
             * 获取QQ音乐推荐歌单类型
             */
            this.getSongTypes = async function() {
                if ($window.__songTypes) {
                    this.songTypes = $window.__songTypes;
                    return $window.__songTypes;
                }

                let res = await $http.get(utils.generateQQApi('v8/fcg-bin/fcg_myqq_toplist.fcg'));
                res = res.data;
                if (res && res.code === 0) {
                    this.songTypes = res.data.topList.map(item => ({
                        type: item.id,
                        label: item.topTitle,
                        picUrl: item.picUrl,
                    }));

                    // 缓存到window对象
                    $window.__songTypes = this.songTypes;
                    return this.songTypes;
                } else {
                    console.error('fetch toplist error');
                }
            }

            /**
             * 获取QQ音乐推荐类型详情（包含推荐列表）
             */
            this.searchSongByType = async function(type) {
                if (type.fetched) {
                    return type.songList;
                }

                let res = await $http.get(utils.generateQQApi(
                    'v8/fcg-bin/fcg_v8_toplist_cp.fcg',
                    {
                        page: 'detail',
                        type: 'top',
                        topid: type.type,
                    }
                ));
                res = res.data || {};
                if (res.code === 0 && res.songlist && res.songlist.length > 0) {
                    type.fetched = true;

                    /// 不管歌曲来自QQ、本地、网易，包装歌曲显示
                    type.songList = res.songlist.map(song => {
                        song.from = 'QQ';
                        song.songName = song.data.songname;
                        song.author = self.getQQSongAuthor(song);
                        song.thumbnail = `http://imgcache.qq.com/music/photo/album_300/${song.data.albumid % 100}/300_albumpic_${song.data.albumid}_0.jpg`;
                        song.duration = clockTimeFilter(song.data.interval);
                        song.albumName = song.data.albumname;
                        return song;
                    });
                    if (this.currentSong && !this.playList) {
                        if (type.songList.find(item => angular.equals(item, self.currentSong))) {
                            $scope.$root.$broadcast('changePlayList', type.songList);
                        }
                    }
                    return type.songList;
                } else {
                    console.warn("tingapi error:", res);
                }
            }

            /**
             * 路由跳转
             */
            this.linkTo = function(route) {
                $location.path(route);
            }

            /**
             * 通知Player播放音乐
             */
            this.emitPlay = function(song, songList) {
                $scope.$root.$broadcast('playSong', { song: song, listType: 'temp',  playList: songList });
            }

            /**
             * 获取QQ歌曲歌手名
             */
            this.getQQSongAuthor = function(song) {
                return (song.data.singer || []).map(s => s.name).join(', ');
            }

            /**
             * 主动更新angular界面
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
            }

            /**
             * 调整到歌单界面，把参数存到location对象
             */
            this.viewList = function(listType, playList) {
                $location.path('/song-list');
                $location.__params = { listType, playList };
            }
        }

    });
} ($module));
