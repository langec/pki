angular.module('reg-ng', [])
  .controller('registrationForm', function($scope, $http){
    $scope.sanCount = 0;
    $scope.data = {};
    $scope.data.registrationRequest = {};
    $scope.data.registrationRequest.sans = [];
    //button click funtion
    $scope.register = function() {
      console.log("request:");
      console.log($scope.data);
      //check input
      $scope.error = [];
      if($scope.data.registrationRequest.c.toString().length != 2){
        console.log("length of c is not 2");
        $scope.error.push('length of Country must be 2!'); 
      }
      
      console.log($scope.error.length);
      if($scope.error.length == 0){
        //formulardaten an registration.js server posten
        console.log('sending registration request');
        
        $http.post("https://localhost:3300/", $scope.data).//"{request: "+$scope.request + "}"
      
        success(function(data, status, headers, config) {
          console.log("registration request send: " + data );
          //formular leeren
          $scope.san = false;
          $scope.sanCount = 0;
          $scope.data = {};
          $scope.data.registrationRequest = {};
          $scope.data.registrationRequest.sans = [];
        }).
        error(function(data, status, headers, config) {
          console.log("registration request not send: " + data);
        });
      }
    };
    //subjectAltName=DNS.1=endpoint.com
    $scope.incSanCount = function(){
      $scope.san = true;
      $scope.sanCount++;
      $scope.data.registrationRequest.sans.push({sanID:'DNS.'+$scope.sanCount, san: ''});
    };
  });