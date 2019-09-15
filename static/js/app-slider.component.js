(function(module) {
    /**
     * slider 组件，值为[0-1]，当鼠标在组件上时，显示指示器。
     */
    module.component('appSlider', {
        templateUrl: 'static/html/app-slider.component.html',
        require: {
            ngModel: '^ngModel',
        },
        bindings: {
            color: '@',           // 进度条颜色 默认#B54E41
            height: '@',          // 进度条高度，默认2px
            indicatorSize: '@',   // 指示器大小，默认12px
            indicatorColor: '@',  // 指示器颜色，默认为进度条颜色
        },
        controller: function($scope, $element) {
            let self = this;
            self.value = 0;

            this.$onInit = function() {
                // 处理ng-model
                this.ngModel.$render = function() {
                    self.value = Math.max(Math.min(self.ngModel.$viewValue || 0, 1), 0);

                    $scope.ratioRef.css({
                        width: `${self.value * 100}%`
                    });

                    let indicatorSize = parseFloat(self.indicatorSize || 12);
                    $scope.indicatorRef.css({
                        left: `calc(${self.value * 100}% - ${indicatorSize / 2})px`
                    });
                };

                this.isShowIndicator = false;
            }

            /**
             * 当值改变时，计算进度条和指示器的位置
             */
            $scope.$watch('$ctrl.value', function(value) {
                self.ngModel.$setViewValue(Math.max(Math.min(value || 0, 1), 0));

                $scope.ratioRef.css({
                    width: `${self.value * 100}%`
                });

                let indicatorSize = parseFloat(self.indicatorSize || 12);
                $scope.indicatorRef.css({
                    left: `calc(${self.value * 100}% - ${indicatorSize / 2}px)`,
                });
            });

            /**
             * angular页面渲染完成时，初始化进度条并添加相应事件
             */
            $scope.$watch('$viewContentLoaded', function() {
                let height = parseFloat(self.height || 2);
                $scope.ratioRef.css({
                    height: `${height}px`,
                    width: `${self.value * 100}%`,
                    background: self.color || '#B54E41',
                });

                let indicatorSize = parseFloat(self.indicatorSize || 12);
                $scope.indicatorRef.css({
                    top: `${height / 2}px`,
                    left: `calc(${self.value * 100}% - ${indicatorSize / 2}px)`,
                    width: `${indicatorSize}px`,
                    height: `${indicatorSize}px`,
                    background: self.indicatorColor || self.color || '#B54E41',
                });

                $element.on('mouseenter', function() {
                    self.isShowIndicator = true;
                    self.setState();
                });

                $element.on('mouseleave', function() {
                    self.isShowIndicator = false;
                    self.setState();
                });

                $element.on('click', function() {
                    self.value = event.clientX / $element[0].getBoundingClientRect().width;
                    self.setState();
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
            }
        }
    });
} ($module));
