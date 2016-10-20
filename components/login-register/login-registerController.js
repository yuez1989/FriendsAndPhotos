'use strict';
cs142App.controller('LRController', ['$scope', '$rootScope', '$location', '$resource', '$http', '$route',
    function ($scope, $rootScope, $location, $resource, $http, $route) {
        $scope.loginErrMsg = "Please enter your name to login";
        $scope.registerMsg = "New user: enter your information here to register";

        $scope.postReq = function (login_name, password) {
            $resource("/admin/login").save({login_name: login_name, password: password}, function (res) {
                if (res.id !== undefined) { // successful login
                    $rootScope.$broadcast('userLoggedIn', res);
                }
                else { // login failure
                    alert('Login failed. Check if name and password are correct.');
                    $route.reload();
                }
            }, function errorHandling(err) {

            });
        };

        $scope.logOut = function() {
            var logoutRes = $resource('/admin/logout');
            logoutRes.save({}, function (res) {
                $rootScope.$broadcast('userLoggedOut');
            }, function errorHandling(err) {
            });
        };

        $scope.postRegist = function(new_login_name, new_password, new_password_confirm,
            first_name, last_name, location, description, occupation) {
            // Check if login name overlaps //BUGGY
            $resource("/checkUser/").save({login_name: new_login_name}, function(res) {
                if (res.id) { // if overlaps
                    alert("Username already exist!");
                }
            });

            // Two password agree
            if (new_password !== new_password_confirm) {
                alert("Two passwords do not agree.");
                $route.reload();
            }

            // post and login if successful, alert if failed
            $resource("/user/").save({login_name: new_login_name, password: new_password, first_name: first_name,
                last_name: last_name, location: location, description: description, occupation: occupation}, function(res) {
                if(res.id !== undefined) { //register successful, automatically login
                    $scope.postReq(res.login_name, new_password);
                }
                else { //register fail
                    alert('Register failed. Please contact web manager');
                    $route.reload();
                }
            });
        }
    }]);