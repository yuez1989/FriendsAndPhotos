'use strict';
cs142App.controller('favoriteController', ['$scope', '$rootScope', '$location', '$resource', '$http', '$route',
    function ($scope, $rootScope, $location, $resource, $http, $route) {
        var doneCallbackFetch = function(response) {
            $scope.safeApply(function () {
                $scope.favorites = response;
            });
        };

        $scope.FetchModel("/favorites/", doneCallbackFetch);

        $scope.favor = function(photo) {
            $resource('/likedPhoto/').save({photo:photo}, function(photo) {
                if (!photo.id) {
                    console.error('favorite photo save error!');
                }
                else {
                    console.log("photo saving success!");
                }
            });
        };

        $scope.deleteFavor = function(photo) {
            $resource('/deletePhoto/').save({photo:photo}, function(photo) {
                if (!photo.id) {
                    console.error('favorite photo delete error!');
                }
                else {
                    console.log("photo delete success!");
                    $route.reload();
                }
            });
        };

        $scope.checkLiked = function(photo_id) {
            $scope.FetchModel("/favorites/", function(response){
                for (var i = 0; i < response.length; ++i) {
                    if (response[i].id === photo_id) {
                        return true;
                    }
                }
                return false;
            });
        }
    }]);