angular.module('reg-ng', [])
  .controller('registrationForm', function($scope, $http){
    
    //button click funtion
    $scope.click = function() {
      console.log("request: "+$scope.data);
      
      //formulardaten an registration.js server posten
      $http.post("http://localhost:3300/", $scope.data).//"{request: "+$scope.request + "}"
      
        success(function(data, status, headers, config) {
          console.log("registration request send: " + data );
          //formular leeren
          $scope.data = null;
        }).
        error(function(data, status, headers, config) {
          console.log("registration request not send: " + data);
        });
    }
  });