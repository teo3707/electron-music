(function (module) {
    const fs = require('fs');
    /**
     * 播放器界面
     */
    module.component('appPlayer', {
        templateUrl: 'static/html/app-player.component.html',
        controller: function($scope, $http, $window, utils) {
            let self = this;

            // 播放模式
            let playModes = {
                allRepeat: 'allRepeat',     // 列表循环
                repeatOnce: 'repeatOnce',   // 单曲循环
                order: 'order',             // 顺序播放
                shuffle: 'shuffle',         // 随机播放
            };

            // 播放模式对应iconfont
            let playModeIcons = {
                allRepeat: 'iconfont icon-repeat',
                repeatOnce: 'iconfont icon-repeat-once',
                order: 'iconfont icon-list',
                shuffle: 'iconfont icon-random',
            };

            // 当前播放进度（当前播放时间/当前歌曲总时间）
            $scope.positionRatio = 0;

            this.$onInit = async function() {
                // 从DB获取播放模式
                let playMode = self.playMode = utils.Player.getPlayMode() || playModes.order;

                // 当前播放状态
                this.state = {
                    isPlaying: false,
                    volume: 1,
                    playMode,
                };
                // 从DB获取当前播放歌曲
                self.currentSong = utils.Player.getCurrentSong();
                this.init();
                if (self.currentSong) {
                    self.playUrl = await self.getPlayUrl(self.currentSong);
                }

                // 从DB获取播放列表
                self.playList = utils.Player.getPlayList();
            }

            this.init = function() {
                let currentIsFavorite = false;
                if (this.currentSong && utils.Player.getSongList('favoriteList').find(item => angular.equals(item, self.currentSong))) {
                    currentIsFavorite = true;
                }

                // 收藏、上一曲、播放/暂停、下一曲
                this.controls = [
                    {
                        clazz: currentIsFavorite ? 'iconfont icon-heart-fill' : 'iconfont icon-heart-stroke',
                        click: function(control) {
                            if (control.clazz.endsWith('icon-heart-stroke')) {
                                control.clazz = 'iconfont icon-heart-fill';
                            } else {
                                control.clazz = 'iconfont icon-heart-stroke';
                            }
                            self.toggleFavorite();
                        },
                    },

                    {
                        clazz: 'iconfont icon-previous',
                        click: function() {
                            self.playNext(-1, true);
                        },
                    },

                    {
                        clazz: 'iconfont icon-play',
                        click: function(control) {
                            self.togglePlay();
                        },
                    },

                    {
                        clazz: 'iconfont icon-next',
                        click: function() {
                            self.playNext(1, true);
                        }
                    }
                ];

                // 播放模式、音量
                this.subControls = [
                    {
                        clazz: self.getPlayModeIcon(),
                        click: self.togglePlayMode,
                    },

                    {
                        clazz: 'iconfont icon-audio-mid',
                        click: function(control) {
                            if (control.clazz.endsWith('icon-audio-mute')) {
                                control.clazz = 'iconfont icon-audio-mid';
                            } else {
                                control.clazz = 'iconfont icon-audio-mute';
                            }
                            self.toggleMute();
                        }
                    }
                ];
            };

            /**
             * 获取播放模式icon
             */
            this.getPlayModeIcon = function() {
                return playModeIcons[this.playMode];
            };

            /**
             * 静音/取消静音
             */
            this.toggleMute = function() {
                $scope.audioRef[0].muted = !$scope.audioRef[0].muted;
            }

            /**
             * 调整播放模式
             */
            this.togglePlayMode = function(control) {
                let keys = Object.keys(playModes);
                let index = keys.indexOf(self.playMode) + 1;
                self.playMode = playModes[keys[index % keys.length]];
                self.state.playMode = self.playMode;
                utils.Player.setPlayMode(playModes[self.playMode]);
                control.clazz = playModeIcons[self.playMode];
            };

            /**
             * 播放/暂停，如果没有当前歌曲，播放推荐列表第一首歌曲
             */
            this.togglePlay = function() {
                this.state.isPlaying = !this.state.isPlaying;
                if (this.state.isPlaying) {
                    if (self.currentSong) {
                        this.play();
                    } else {
                        this.playNext();
                    }
                } else {
                    this.pause();
                }
            };

            /**
             * 切歌
             *
             * @params offset -1 previous, 1 next.
             */
            this.playNext = function(offset, forcePlay) {
                if (!self.playList) {
                    self.playList = ($window.__songTypes || [])[0].songList || [];
                }

                if (self.playList.length) {
                    let index = 0;
                    let equalsFn = function(a, b) {
                        if (a.from === 'local') {
                            return a.path === b.path;
                        }
                        return angular.equals(a, b);
                    }

                    switch (self.state.playMode) {
                        case 'order':
                            if (self.currentSong) {
                                index = self.playList.findIndex(item => equalsFn(item, self.currentSong)) + (offset || 1);
                            }

                            if (forcePlay) {
                                index = (index + self.playList.length) % self.playList.length;
                            }

                            if (index < self.playList.length) {
                                self.doPlay(self.playList[index]);
                            } else {
                                self.pause();
                            }
                            break;

                        case 'repeatOnce':
                            if (angular.isNumber(offset)) {
                                index = (self.playList.findIndex(item => equalsFn(item, self.currentSong)) + (offset || 0));
                                index = (index + self.playList.length) % self.playList.length;
                                self.doPlay(self.playList[index]);
                            } else {
                                self.play();
                            }
                            break;

                        case 'allRepeat':
                            if (self.currentSong) {
                                index = (self.playList.findIndex(item => equalsFn(item, self.currentSong)) + (offset || 1));
                                index = (index + self.playList.length) % self.playList.length;
                            }
                            self.doPlay(self.playList[index]);
                            break;

                        case 'shuffle':
                            if (self.currentSong) {
                                index = ~~(Math.random() * self.playList.length);
                            }
                            self.doPlay(self.playList[index]);
                            break;

                        default:

                    }
                } else {
                    if (self.currentSong) {
                        self.seek(0);
                        if (!self.state.isPlaying) {
                            self.play();
                        }
                    }
                }
            }

            /**
             * 播放并更新相应icon
             */
            this.play = function() {
                $scope.audioRef[0].play()
                .then(function() {
                    let control = self.controls.find(item => item.clazz.endsWith('icon-play') || item.clazz.endsWith('icon-pause'));
                    control.clazz = 'iconfont icon-pause';

                    let equalsFn = utils.songEquils;

                    /// 最近播放
                    let historyList = utils.Player.getSongList('historyList');
                    let index = historyList.findIndex(item => equalsFn(item, self.currentSong));
                    if (index !== -1) {
                        historyList.splice(index, 1);
                    }
                    historyList.unshift(self.currentSong);
                    utils.Player.setSongList('historyList', historyList.slice(0, 100));

                    /// 收藏/取消收藏
                    let favoriteList = utils.Player.getSongList('favoriteList');
                    let favoriteControl = self.controls.find(item => item.clazz.endsWith('icon-heart-stroke') || item.clazz.endsWith('icon-heart-fill'));
                    if (favoriteList.find(item => angular.equals(item, self.currentSong))) {
                        favoriteControl.clazz = 'iconfont icon-heart-fill';
                    } else {
                        favoriteControl.clazz = 'iconfont icon-heart-stroke';
                    }
                }).catch(function(e) {
                    self.state.isPlaying = false;
                    let control = self.controls.find(item => item.clazz.endsWith('icon-play') || item.clazz.endsWith('icon-pause'));
                    control.clazz = 'iconfont icon-play';
                    alert('获取不到播放源，不能播放该歌曲');
                    console.warn('<error play>', e);
                });
            }

            /**
             * 暂停并更新相应icon
             */
            this.pause = function() {
                let control = this.controls.find(item => item.clazz.endsWith('icon-play') || item.clazz.endsWith('icon-pause'));
                control.clazz = 'iconfont icon-play';
                $scope.audioRef[0].pause();
            }

            /**
             * 调整歌曲进度
             */
            this.seek = function(sec) {
                $scope.audioRef[0].currentTime = sec;
            }

            this.toggleFavorite = function() {
                if (!self.currentSong) {
                    return;
                }
                let favoriteList = utils.Player.getSongList('favoriteList');
                let index = favoriteList.findIndex(item => angular.equals(item, self.currentSong));
                if (index !== -1) {
                    favoriteList.splice(index, 1);
                } else {
                    favoriteList.unshift(self.currentSong);
                }
                utils.Player.setSongList('favoriteList', favoriteList);
                $scope.$root.$broadcast('changeFavoriteList', favoriteList);
            };

            /**
             * 当点击播放进度条时，调整歌曲播放进度
             */
            this.onChange = function() {
                this.seek(($scope.audioRef[0].duration || 0) * $scope.positionRatio);
            }

            /**
             * 获取当前歌曲时长
             */
            this.getDuration = function() {
                return $scope.audioRef[0].duration || 0;
            }

            /**
             * 播放QQ、本地、网易等类型的歌曲
             */
            self.doPlay = function(song) {
                // 保存当前播放歌曲信息
                utils.Player.setCurrentSong(song);
                self.currentSong = song;
                $scope.$root.$broadcast('changeCurrentSong', song);
                self.state.isPlaying = true;
                switch (song.from) {
                    case 'QQ':
                        self.playSongFromQQ(song);
                        break;

                    case 'local':
                        self.playSongFromLocal(song);
                        break;

                    default:
                }
            }

            /**
             * 获取播放地址
             */
            self.getPlayUrl = async function(song) {
                switch (song.from) {
                    case 'QQ':
                        return self.getQQPlayUrl(song);

                    case 'local':
                        if (song.apic) {
                            let pos = song.apic.split(",").map(i => parseInt(i));
                            song.thumbnail = $window.URL.createObjectURL(new Blob([fs.readFileSync(song.path).slice(pos[0], pos[1])]));
                        } else {
                            song.thumbnail = 'static/images/default-song-thumbnail.png';
                        }
                        self.state.duration = song.interval;
                        return song.path;

                    default:

                }
            }

            /**
             * 获取QQ音乐播放地址
             */
            self.getQQPlayUrl = async function(song) {
                let songmid = song.data.songmid
                let guid = 126548448;
                let filename = `C400${songmid}.m4a`;
                let cid = '205361747';
                // let res = await $http.get(`https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?format=json205361747&platform=yqq&cid=${cid}&songmid=${songmid}&filename=${filename}&guid=${guid}`);
                let res = await $http.get(utils.generateQQApi('base/fcgi-bin/fcg_music_express_mobile3.fcg', {cid,songmid,filename,guid}))
                return `http://ws.stream.qqmusic.qq.com/${filename}?fromtag=0&guid=${guid}&vkey=${res.data.data.items[0].vkey}`;
            }

            /**
             * 播放QQ音乐
             */
            this.playSongFromQQ = async function(song) {
                // 当audio的src改变时，会触发`durationchange`事件，由该事件处理播放
                self.playUrl = await self.getQQPlayUrl(song);
                self.setState();
            };

            /**
             * 播放本地音乐文件
             */
            this.playSongFromLocal = async function(song) {
                self.playUrl = song.path;
                if (song.apic) {
                    let pos = song.apic.split(",").map(i => parseInt(i));
                    song.thumbnail = $window.URL.createObjectURL(new Blob([fs.readFileSync(song.path).slice(pos[0], pos[1])]));
                } else {
                    song.thumbnail = 'static/images/default-song-thumbnail.png';
                }
                self.play();
            }

            /**
             * 处理`playSong`事件
             */
            $scope.$on('playSong', async function(_, data) {
                /// 列表类型为temp，不做存储
                if (data.listType === 'temp') {
                    utils.Player.removePlayList();
                }

                if (self.playList !== data.playList) {
                    self.playList = data.playList;
                    if (data.listType !== 'temp') {
                        utils.Player.setPlayList(data.listType);
                    }
                }

                if (angular.equals(self.currentSong, data.song)) {
                    self.togglePlay();
                    return;
                }

                self.doPlay(data.song);
            });

            /*
             * 更新播放列表
             */
            $scope.$on('changePlayList', function(_, playList) {
                self.playList = playList;
            });


            $scope.$watch('$viewContentLoaded', function() {
                let audio = $scope.audioRef;

                // 播放时更新进度条
                audio.on('timeupdate', function(event) {
                    $scope.positionRatio = audio[0].currentTime / audio[0].duration;
                    self.state.currentTime = audio[0].currentTime;
                    self.setState();
                });

                // 更新当前播放歌曲时长
                audio.on('loadedmetadata', function() {
                    self.state.duration = self.getDuration();
                });

                // 播放结束时切歌
                audio.on('ended', function() {
                    self.playNext();
                });

                //
                audio.on('emptied', function() {
                    if (self.state.isPlaying) {
                        self.state.duration = self.getDuration();
                        self.play();
                    }
                });
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
