(function() {
    // electron app reference
    const electron = require('electron').remote;

    // global angularjs module reference
    let module = angular.module('app', ['ngRoute']);

    // inject electron
    module.value('electron', electron);

    /**
     * 配置route
     */
    module.config(function($routeProvider, $locationProvider) {
        $routeProvider.when('/', {
            template: '<app-home></app-home>',
        })
        .when('/about', {
            template: '<app-about></app-about>',
        })
        .when('/user-edit', {
            template: '<app-user-edit></app-user-edit>',
        })
        .when('/song-list', {
            template: '<app-song-list></app-song-list>',
        })
        .when('/search', {
            template: '<app-search></app-search>'
        })
        .when('/favorite-list', {
            template: '<app-favorite-list></app-favorite-list>',
        })
        .when('/local-list', {
            template: '<app-local-list></app-local-list>',
        });
    });


    /**
     * 点击时水波扩散效果
     *
     * Example:
     *  <div ripple></div>
     */
    module.directive('ripple', function($window){
        let link = function(scope, element, attrs) {
            element.on('click', function(event) {
                let ripple = $window.document.createElement('div');
                ripple.classList.add('ripple');

                let { clientX, clientY } = event;
                let { x, y } = element[0].getBoundingClientRect();
                ripple.style.top = (clientY - y) + 'px';
                ripple.style.left = (clientX - x) + 'px';

                if (attrs.ripple) {
                    ripple.style.background = attrs.ripple;
                }
                element[0].appendChild(ripple);

                element[0].style.position = 'relative';
                let overflow = element[0].style.overflow;
                element[0].style.overflow = 'hidden';

                let outerBox = element[0].getBoundingClientRect();
                let times = 0;

                /// 使用`setInterval`检查是否已经到达边缘，达到则删除ripple的dom。
                /// 使用`$scope.$watch`会导致angularjs认为更新太频繁而报错。
                let intervalId = setInterval(function() {
                    times++;
                    if (times >= 1000 / 20) {
                        clear();
                    }

                    const { top, left, bottom, right } = ripple.getBoundingClientRect();
                    if (outerBox.top < top || outerBox.left < left || outerBox.right > right || outerBox.bottom > bottom) {
                        return;
                    }

                    clear();
                }, 20);


                function clear() {
                    element[0].style.overflow = overflow;
                    ripple.remove();
                    clearInterval(intervalId);
                }
            });
        };
        return {
            restrict: 'A',
            link
        };
    });

    /**
     * 动态添加组件，组件必须提前注册。
     *
     * bindings:
     *    name: 组件名字
     *    model: 需要在组件间传递的model
     */
    module.component('dynamicWrap', {
        bindings: {
            model: '=',
            name: '@',
        },
        controller: function($element, $scope, $compile) {
            let $ctrl = this;
            $ctrl.$onInit = function() {
                $element.append($compile(`<${$ctrl.name} model="$ctrl.model"></${$ctrl.name}>`)($scope));
            }
        }
    });

    /**
     * 表单编辑组件
     *
     * bindings:
     *   fields: 字段定义的数组, e.g. [{label, type, value, ...}, ...]
     */
    module.component('formEditor', {
        templateUrl: 'static/html/form-editor.component.html',
        bindings: {
            fields: '=',
        },
        controller: function($scope) {
            let $ctrl = this;
        }
    });

    module.component('appButton', {
        bindings: {
            button: '=',
        },
        template: `
        <div class="btn-container" ng-ref="btnRef">
          <span ng-class="$ctrl.btnClasses" ng-click="$ctrl.handleClick($event)">{{$ctrl.button.label}}</span>
        </div>`,
        controller: function($scope, $window) {
            this.$onInit = function() {
                this.btnClasses = {
                    btn: true,
                    ['btn-' + (this.button.size || 'medium')]: true,
                    ['btn-' + (this.button.type || 'normal')]: true,
                };
            }

            this.handleClick = function(event) {
                let ripple = $window.document.createElement('div');
                ripple.classList.add('ripple');

                let { clientX, clientY } = event;
                let { x, y } = $scope.btnRef[0].getBoundingClientRect();
                ripple.style.top = (clientY - y) + 'px';
                ripple.style.left = (clientX - x) + 'px';
                $scope.btnRef[0].appendChild(ripple);


                let rippleSize = function() {
                    const { top, left, bottom, right } = ripple.getBoundingClientRect();
                    return { top, left, bottom, right };
                };

                let outerBox = $scope.btnRef[0].getBoundingClientRect();
                let intervalId = setInterval(function() {
                    const { top, left, bottom, right } = ripple.getBoundingClientRect();
                    if (outerBox.top < top || outerBox.left < left || outerBox.right > right || outerBox.bottom > bottom) {
                        return;
                    }
                    ripple.remove();
                    clearInterval(intervalId);
                }, 20);
                (typeof this.button.click === 'function') && this.button.click(event);
            }

            $scope.$watch('$viewContentLoaded', function() {
                $scope.btnRef.ready(function() {
                    let box = $scope.btnRef.children()[0].getBoundingClientRect();
                    $scope.btnRef[0].style.width = box.width + 'px';
                    $scope.btnRef[0].style.height = box.height + 'px';
                });
            })
        }
    });

    module.component('appButtons', {
        bindings: {
            buttons: '=',
        },
        templateUrl: 'static/html/app-buttons.component.html',
    });

    module.component('appDialog', {
        templateUrl: 'static/html/app-dialog.component.html',
        controller: function($scope, $element) {
            // 标识组件，构建完成后 utils.dialog返回此scope对象。
            $scope.__identify = 'appDialog';

            $scope.closeFn = function() {
                $scope.$destroy();
                $element.remove();
            }

            $scope.closeDialog = function($event) {
                if ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    $scope.closeFn();
                    return false;
                }
            }
        }
    });


    module.factory('utils', function($window, $compile) {
        /**
         * 对话框
         *
         * @return dialog $scope
         */
        async function dialog() {
            let dom = $window.document.createElement('app-dialog');
            $window.document.body.appendChild(dom);
            let template = angular.element(dom);
            let linkFn = $compile(template);
            let scope = template.scope();
            let element = linkFn(scope);

            let startDrag = false;
            let startPoint;
            let previousPosition;

            // drag dialog
            element.on('mousedown', function(event) {
                element[0].style.cursor = 'move';
                startDrag = true;
                startPoint = { x: event.clientX, y: event.clientY };
                let bbox = element[0].getBoundingClientRect();
                previousPosition = { left: bbox.left + bbox.width / 2, top: bbox.top + bbox.height / 2};
            });

            element.on('mousemove', function(event) {
                if (startDrag) {
                    let x = event.clientX;
                    let y = event.clientY;
                    let offset = { x: x - startPoint.x, y: y - startPoint.y };
                    element.css({
                        left: `${previousPosition.left + offset.x}px`,
                        top: `${previousPosition.top + offset.y}px`
                    });
                }
            });

            element.on('mouseleave', function(event) {
                startDrag = false;
                element[0].style.cursor = '';
            });

            element.on('mouseup', function(event) {
                startDrag = false;
                element[0].style.cursor = '';
            });

            // 返回appDialog的scope
            while (scope.$$childTail.__identify !== 'appDialog') {
                await sleep(10);
            }
            return scope.$$childTail;
        };

        /**
         * 生成系统临时用的id
         */
        let gensym = (function () {
            let id = 0;
            return function() {
                return `gensym${id++}`;
            }
        } ());

        /**
         * async function 中的等待方法
         */
        function sleep(millsecs) {
            return new Promise(function(resolve, reject) {
                setTimeout(() => resolve(), millsecs);
            });
        }

        // qq音乐接口
        let generateQQApi = function(api, params) {
            params = params || {};
            let baseUrl = `https://c.y.qq.com/${api}?g_tk=5381&uin=0&format=json&inCharset=utf-8&outCharset=utf-8&notice=0&platform=h5&needNewCode=1`;

            let pairs = [];
            Object.keys(params).forEach(function(k) {
                pairs.push(`${k}=${params[k]}`);
            });
            pairs.push(`_=${+new Date()}`);
            return baseUrl + '&' + pairs.join('&');
        }

        /**
         * 生成唯一的uuid
         */
        function uuid() {
            return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                let r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        }

        /**
         * localStorage 简单封装，通过JSON进行序列化
         */
        const DB = {
            getItem: function(key) {
                let rawValue = $window.localStorage.getItem(key);
                if (rawValue !== null) {
                    try {
                        return $window.JSON.parse(rawValue);
                    } catch (e) {
                        console.warn("<error DB.getItem>", key, e);
                    }
                }
            },
            setItem: function(key, value) {
                $window.localStorage.setItem(key, $window.JSON.stringify(value));
            },
            removeItem: function(key) {
                $window.localStorage.removeItem(key);
            }
        };

        const Player = {
            getCurrentSong: function() {
                return DB.getItem('playSong');
            },
            setCurrentSong: function(song) {
                DB.setItem('playSong', song);
            },
            getPlayList: function() {
                return DB.getItem(DB.getItem('playList'));
            },
            getPlayListType: function() {
                return DB.getItem('playList');
            },
            setPlayList: function(playListKey) {
                DB.setItem('playList', playListKey);
            },
            removePlayList: function() {
                DB.removeItem('playList');
            },
            getPlayMode: function() {
                return DB.getItem('playMode');
            },
            setPlayMode: function(mode) {
                DB.setItem('playMode', mode);
            },
            getSongList: function(key) {
                return DB.getItem(key) || [];
            },
            addSongList: function(key, song) {
                let list = Player.getSongList() || [];
                list.push(song);
                Player.setSongList(list);
            },
            setSongList: function(key, list) {
                DB.setItem(key, list);
            },
            removeSongFromList: function(key, song) {
                let list = Player.getSongList() || [];
                list = list.filter(item => !angular.equals(item, song));
                Player.setSongList(song, list);
            }
        }

        function songEquils(a, b) {
            if (a.from !== b.from) {
                return false;
            }
            
            if (a.from === 'local') {
                return a.path === b.path;
            }

            if (a.from === 'QQ') {
                return a.data.songmid === b.data.songmid;
            }

            return angular.equals(a, b);
        }

        return {
            dialog,
            gensym,
            sleep,
            generateQQApi,
            uuid,
            DB,
            Player,
            songEquils,
        }
    });

    //// custom filters
    module.filter('clockTime', function(dateFilter) {
        return function(seconds) {
            if (!seconds) {
                return '00:00';
            }
            return dateFilter(seconds * 1000, 'mm:ss');
        }
    });

    window.$module = module;
} ());
