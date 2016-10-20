'use strict';

/**
 * Receive submitted comments and post it to the back end
 */
cs142App.controller('SubmitCommentController', ['$scope', '$route', '$rootScope', '$location', '$resource', '$http',
    function ($scope, $route, $rootScope, $location, $resource, $http) {
        $scope.submitComment = function(photo) {
            var loginRes = $resource("/commentsOfPhoto/" + photo['_id']);
            loginRes.save({new_comment: $scope.newComment}, function (res) {
                if (res.id !== undefined) {
                    $route.reload(); // update the view
                    $location.path("/photos/" + res.id);
                }
            }, function errorHandling(err) {

            });
        }
    }]);