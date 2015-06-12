angular.module('reg-ng', [])
  .controller('registrationForm', function($scope, $http){
    $scope.click = function() {
      console.log("request: "+$scope.data);
      $http.post("http://localhost:3300/", $scope.data).//"{request: "+$scope.request + "}"
        success(function(data, status, headers, config) {
          console.log("registration request send: " + data );
          $scope.data = null;
        }).
        error(function(data, status, headers, config) {
          console.log("registration request not send: " + data);
        });
    }
  });