(function(module) {
    const fs = require('fs');
    const path = require('path');

    /**
     * 左侧导航界面
     */
    module.component('appSideBar', {
        templateUrl: 'static/html/app-side-bar.component.html',
        controller: function($scope, $window, $location, clockTimeFilter, electron, utils) {
            let self = this;

            this.$onInit = function() {
                this.user = utils.DB.getItem('userInfo') || {};
                this.user.name = this.user.name || '用户名';
                this.initUserIcon();

                // 左侧操作和歌单
                this.actions = [
                    {
                        label: '添加本地文件',
                        action: self.addLocalSongs,
                    },
                    {
                        label: '最近播放',
                        action: function() {
                            $location.path('/song-list');
                            let historyList = utils.Player.getSongList('historyList')
                            $location.__params = { listType: 'historyList', playList:  historyList};
                            if (utils.Player.getPlayListType() === 'historyList') {
                                $scope.$root.$broadcast('changePlayList', historyList);
                            }
                        },
                    },
                    {
                        label: '首页',
                        action: function() {
                            $location.path('/');
                        },
                    },
                    {
                        label: '我的歌单',
                        key: 'playList',
                        children: [
                            {
                                label: '我喜欢的音乐',
                                action: function() {
                                    $location.path('/favorite-list');
                                }
                            },
                            {
                                label: '本地音乐',
                                action: function() {
                                    $location.path('/local-list');
                                }
                            },
                            // {
                            //     label: '添加' ,
                            //     action: function() {
                            //         utils.dialog();
                            //     }
                            // },
                        ]
                    }
                ];
            }

            /**
             * 添加本地音乐
             */
            self.addLocalSongs = async function() {
                let files = await electron.dialog.showOpenDialogSync({
                    title: '请选择本地音乐',
                    filters: [
                        { name: 'Music', extensions: ['mp3', 'wav', 'aiff', 'mpeg'] },
                        { name: 'All Files', extensions: ['*'] }
                    ],
                    defaultPath: self.previousPickPath || electron.app.getPath('music'),
                    properties: ['openFile', 'openDirectory', 'multiSelections']
                });
                let songs = await self.doAddLocalSongs(files);
                utils.Player.setSongList('localList', songs);
                $scope.$root.$broadcast('changeLocalList', songs);
            }

            self.doAddLocalSongs= async function(files, dir) {
                let songs = [];
                for (let i = 0; i < files.length; i++) {
                    let file = dir ? path.join(dir, files[i]) : files[i];
                    let stat = fs.statSync(file);
                    if (stat.isDirectory()) {
                        let temp = await self.doAddLocalSongs(fs.readdirSync(file), file);
                        temp.forEach(item => songs.push(item));

                    } else if (stat.isFile() || stat.isSymbolicLink) {
                        // 通过`<audio></audio>`解析文件
                        await new Promise((resolve, reject) => {
                            let audio = angular.element($window.document.createElement('audio'));
                            audio[0].src = file;
                            audio.on('loadedmetadata', function() {
                                let fileObj = fs.readFileSync(file);

                                if ('' + fileObj.slice(0, 3) === 'ID3') { // ID3V2
                                    let songInfo = {};
                                    try {
                                        songInfo = Mp3.parseID3V2(fileObj);
                                    } catch (e) {
                                        console.warn(e);
                                    }
                                    songs.push({
                                        from: 'local',
                                        path: file,
                                        songName: songInfo.songName || self.getSplitFile(file)[0],
                                        author: songInfo.author || self.getSplitFile(file)[0],
                                        duration: clockTimeFilter(audio[0].duration),
                                        interval: audio[0].duration,
                                        albumName: songInfo.albumName,
                                        apic: songInfo.apic,
                                    });
                                } else if ('' + fileObj.slice(fileObj.length - 128) === 'TAG') { // ID3V1

                                } else { // not mp3 format.

                                }
                                resolve();
                            });
                            audio.on('error', function() {
                                resolve();
                            })
                        });
                    }
                }
                return songs;
            }

            this.getSplitFile = function(file) {
                let names = path.basename(file).split('.');
                if (names.length <= 2) {
                    return names
                }
                return [names.slice(0, names.length - 1).join("."), names[names.length - 1]];
            }

            /**
             * 路由返回
             */
            this.back = function() {
                $window.history.back();
            }

            this.userIconPath = path.join(electron.app.getPath('userData'), "userIcon");
            this.defalutUserIconPath = 'static/images/default-user-icon.png';

            /**
             * 初始化用户头像
             */
            this.initUserIcon = async function() {
                if (fs.existsSync(this.userIconPath)) {
                    this.user.icon = this.userIconPath;
                } else {
                    this.user.icon = this.defalutUserIconPath;
                }
            }

            /**
             * 选择用户头像
             */
            this.pickUserIcon = async function() {
                let icon = await electron.dialog.showOpenDialogSync({
                    title: '请选择用户头像',
                    defaultPath: self.previousPickPath || electron.app.getPath('pictures'),
                    filters: [
                        { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
                        { name: 'All Files', extensions: ['*'] }
                    ],
                });
                if (icon && icon.length > 0) {
                    self.previousPickPath = path.dirname(icon[0]);
                    await fs.copyFile(icon[0], this.userIconPath, () => {
                        // 通过blob对象更新url
                        self.user.icon = $window.URL.createObjectURL(new Blob([fs.readFileSync(self.userIconPath)]));
                        self.setState();
                    });
                }
            }

            /**
             * 跳转到用户边界界面
             */
            this.gotoUserEdit = function() {
                $location.path('/user-edit');
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
            }

            /**
             * 编辑用户完成时，更新界面
             */
            $scope.$on('userInfoUpdated', function(_, user) {
                self.user = user;
            });
        }
    });
} ($module));
