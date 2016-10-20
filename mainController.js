'use strict';

var cs142App = angular.module('cs142App', ['ngRoute', 'ngMaterial', 'ngResource']);

cs142App.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/users', {
            templateUrl: 'components/user-list/user-listTemplate.html',
            controller: 'UserListController'
        }).when('/users/:userId', {
            templateUrl: 'components/user-detail/user-detailTemplate.html',
            controller: 'UserDetailController'
        }).when('/photos/:userId', {
            templateUrl: 'components/user-photos/user-photosTemplate.html',
            controller: 'UserPhotosController'
        }).when('/login-register', {
            templateUrl: 'components/login-register/login-registerTemplate.html',
            controller: 'LRController'
        }).when('/photo-search/', {
            templateUrl: 'components/search-photo/search.html',
            controller: 'searchController'
        }).when('/favorites/', {
            templateUrl: 'components/favorites/favorites.html',
            controller: 'favoriteController'
        }).otherwise({
            redirectTo: '/users'
        });
    }]);

cs142App.controller('MainController', ['$scope', '$rootScope', '$location', '$resource', '$http', '$route',
    function ($scope, $rootScope, $location, $resource, $http, $route) {
        var noOneIsLoggedIn = true;
        /* Listeners to change the login session state */
        $scope.$on('userLoggedIn', function (event, user) {
            noOneIsLoggedIn = false;
            $scope.loggedUser = user;
            $location.path("/users/" + user.id);
            $route.reload();
        });

        $scope.$on('userLoggedOut', function () {
            noOneIsLoggedIn = true;
            $scope.loggedUser = undefined;
            $location.path("/login-register");
            $route.reload();
        });

        // Redirect any page to login-register
        $rootScope.$on("$routeChangeStart", function (event, next, current) {
            if (noOneIsLoggedIn) {
                // no logged user, redirect to /login-register unless already there
                if (next.templateUrl !== "components/login-register/login-registerTemplate.html") {
                    $location.path("/login-register");
                }
            }
        });

        $scope.main = {};
        $scope.main.title = 'Users';
        $scope.main.myName = "Yue Zhang";

        /*
         * FetchModel - Fetch a model from the web server.
         *   url - string - The URL to issue the GET request.
         *   doneCallback - function - called with argument (model) when the
         *                  the GET request is done. The argument model is the object
         *                  containing the model. model is undefined in the error case.
         */
        $scope.FetchModel = function (url, doneCallback) {
            function xhrHandler() {
                // If fails
                if (this.readyState != 4) {
                    return;
                }
                if (this.status != 200) {
                    console.error("FetchModel error! status is not 200");
                    return;
                }
                // If successful
                doneCallback(JSON.parse(xhr.responseText));
            }

            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = xhrHandler;
            xhr.open("GET", url);
            xhr.send();
        };

        /**
         * Safe version of $apply
         * @param fn
         */
        $scope.safeApply = function (fn) {
            var phase = "";
            if (this.$root) {
                phase = this.$root.$$phase;
            }
            if (phase == '$apply' || phase == '$digest') {
                if (fn && (typeof(fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        };

        /**
         * Callback fetching from test/info
         * @param response
         */
        var doneCallback1 = function (response) {
            $scope.safeApply(function () {
                // Put your code that updates any $scope variables here
                $scope.main.response = response["version"];
            });
        };

        $scope.FetchModel("test/info", doneCallback1);

        /* Uploading Photos */
        var selectedPhotoFile;   // Holds the last file selected by the user

        // Called on file selection - we simply save a reference to the file in selectedPhotoFile
        $scope.inputFileNameChanged = function (element) {
            selectedPhotoFile = element.files[0];

            if (!selectedPhotoFile) {
                console.error("uploadPhoto called will no selected file");
                return;
            }
            console.log('fileSubmitted', selectedPhotoFile);
        };

        $scope.uploadPhoto = function() {
            // Create a DOM form and add the file to it under the name uploadedphoto
            var domForm = new FormData();
            domForm.append('uploadedphoto', selectedPhotoFile);

            // Using $http to POST the form
            $http.post('/photos/new', domForm, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).success(function(newPhoto){
                console.log('new photo added!', newPhoto);
            }).error(function(err){
                // Couldn't upload the photo. XXX  - Do whatever you want on failure.
                console.error('ERROR uploading photo', err);
            });
        };
    }]);
