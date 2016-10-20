'use strict';
cs142App.controller('searchController', ['$scope', '$rootScope', '$location', '$resource', '$http', '$route',
    function ($scope, $rootScope, $location, $resource, $http, $route) {
        /* Full Text Search*/
        /**
         * Search submmited text and redirect the page to photo thumbnail page
         */
        $scope.search = function (text) {
            if (text == "") {
                alert("You searched empty text!"); // prevent empty search -- that would be too resource-consuming in large database
            }
            // If text is valid, post it to back-end and deal with the result
            var doneCallbackSearch = function (response) {
                $route.reload();
                if (response.length === 0) {
                    alert("Haven't found any photo! Try again");
                }
                else {
                    $scope.safeApply(function () {
                        $scope.main.searchRes = response;
                        $scope.main.queryString = text;
                        $location.path('photo-search');
                        $route.reload();
                    });
                }
            };
            $scope.FetchModel('/textSearch/' + text, doneCallbackSearch);
        };
    }]);