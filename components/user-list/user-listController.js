'use strict';
cs142App.controller('UserListController', ['$scope','$rootScope','$location', '$resource', '$http', '$route',
    function ($scope, $rootScope, $location, $resource, $http, $route) {
        $scope.main.title = 'Users';
        /**
         * Callback fetching from user/list
         * @param response
         */
        var doneCallback2 = function(response) {
            $scope.safeApply(function() {
                $scope.main.users = response;
            });
        };

        $scope.$on('userLoggedIn', function() {
            $scope.FetchModel("user/list", doneCallback2);
        });
    }]);

