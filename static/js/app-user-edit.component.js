(function(module) {
    /**
     * 编辑用户信息界面
     */
    module.component('appUserEdit', {
        templateUrl: 'static/html/app-user-edit.component.html',
        controller: function($scope, $window) {
            this.$onInit = function() {
                let user = $window.JSON.parse($window.localStorage.getItem('userInfo') || '{}');
                let self = this;

                // 编辑表单显示的字段
                this.fields = [
                    {
                        label: '昵称',
                        placeholder: '请输入昵称',
                        type: 'text',
                        value: user.name || '',
                        field: 'name',
                    }
                ];

                // 按钮组
                this.actions = [
                    {
                        label: '保存',
                        click: function() {
                            let editUser = {};
                            for (let i = 0; i < self.fields.length; i++) {
                                let field = self.fields[i];
                                editUser[field.field] = field.value;
                            }
                            user = { ...user, ...editUser };
                            $window.localStorage.setItem('userInfo', $window.JSON.stringify(user));
                            $scope.$root.$broadcast('userInfoUpdated', user);
                        }
                    },
                    {
                        label: '取消',
                        click: function() {
                            $window.history.back();
                        }
                    }
                ]
            }
        }
    });
} ($module));
