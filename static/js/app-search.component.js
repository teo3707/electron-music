(function(module) {
    module.component('appSearch', {
        templateUrl: 'static/html/app-search.component.html',
        controller: function($scope, $http, clockTimeFilter, utils) {
            let self = this;

            this.search = function(event) {
                let keyword = (this.keyword || '').trim();
                if (event.key === 'Enter' && keyword) {
                    this.doSearch(keyword);
                }
            }

            /**
             * QQ音乐搜索、网易音乐搜索等
             */
            this.doSearch = async function(keyword) {
                // let qqSearchUrl = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?aggr=1&cr=1&flag_qc=0&p=1&n=30&w=${keyword}`;
                let qqSearchUrl = utils.generateQQApi('soso/fcgi-bin/client_search_cp', {w: keyword, n: 100});
                let res = await $http.get(qqSearchUrl);
                let qqSongList;
                try {
                    qqSongList = res.data.data.song.list || [];
                } catch(e) {
                    console.warn('<error search qq music>', res);
                    qqSongList = [];
                }

                qqSongList.forEach(song => {
                    song.from = 'QQ',
                    song.songName = song.songname;
                    song.author = self.getQQSongAuthor(song);
                    song.thumbnail = `http://imgcache.qq.com/music/photo/album_300/${song.albumid % 100}/300_albumpic_${song.albumid}_0.jpg`;
                    song.duration = clockTimeFilter(song.interval);
                    song.albumName = song.albumname;
                    song.data = {
                        songmid: song.songmid,
                    };
                });

                // TODO: 网易音乐搜索

                self.songList = qqSongList;
                self.setState();
            }

            /**
             * 获取QQ歌曲歌手名
             */
            this.getQQSongAuthor = function(song) {
                return (song.singer || []).map(s => s.name).join(', ');
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
        }
    });
} ($module));
