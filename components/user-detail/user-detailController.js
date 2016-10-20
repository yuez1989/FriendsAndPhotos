'use strict';

cs142App.controller('UserDetailController', ['$scope', '$routeParams', '$rootScope', '$location', '$resource', '$http',
    function ($scope, $routeParams, $rootScope, $location, $resource, $http) {
        /*
         * Since the route is specified as '/users/:userId' in $routeProvider config the
         * $routeParams  should have the userId property set with the path from the URL.
         */
        var userId = $routeParams.userId;
        $scope.main.photos = null;
        /**
         * Callback fetching from user/:id
         * @param response
         */
        var doneCallback3 = function (response) {
            $scope.safeApply(function () {
                $scope.main.user = response;
            });
        };

        /* If no one is logged in, redirect to login page; If someone is logged in, view normally. */
        var noOneIsLoggedIn = true;
        $scope.$on('userLoggedIn', function (event, user) {
            noOneIsLoggedIn = false;
        });
        if (noOneIsLoggedIn) {
            $scope.FetchModel("user/" + userId, doneCallback3);
        }
    }]);
