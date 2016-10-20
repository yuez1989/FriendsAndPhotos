'use strict';


cs142App.controller('UserPhotosController', ['$scope', '$routeParams', '$rootScope', '$location', '$resource', '$http',
    function ($scope, $routeParams, $rootScope, $location, $resource, $http) {
        /*
         * Since the route is specified as '/photos/:userId' in $routeProvider config the
         * $routeParams  should have the userId property set with the path from the URL.
         */
        var userId = $routeParams.userId;
        /**
         * Callback fetching from user/:id
         * @param response
         */
        var doneCallback4 = function (response) {
            if (response.length === 0) {
                alert("No photo yet! Upload one!");
            }
            $scope.FetchModel("/favorites/", function(favs) {
                for (var i = 0; i < response.length; ++i) {
                    response[i].liked = false;
                    for (var j = 0; j < favs.length; ++j) {
                        if (response[i].id === favs[j].id) {
                            response[i].liked = true;
                        }
                    }
                }
                $scope.safeApply(function () {
                    $scope.main.photos = response;
                });
            });
        };

        /* If no one is logged in, redirect to login page; If someone is logged in, view normally. */
        var noOneIsLoggedIn = true;
        $scope.$on('userLoggedIn', function (event, user) {
            noOneIsLoggedIn = false;
        });
        if (noOneIsLoggedIn) {
            $scope.FetchModel("/photosOfUser/" + userId, doneCallback4);
        }
    }]);
