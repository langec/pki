angular.module('reg-ng', [])
  .controller('registrationForm', function($scope, $http){
    $scope.data = {};
    $scope.data.registrationRequest = {};
    $scope.data.registrationRequest.sans = [];
    
    $scope.sanTypes = ["DNS","IP"];
    
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
        
        var DNScount = 0, IPcount = 0; 
        for (var i = 0; i < $scope.data.registrationRequest.sans.length; i++) {
          if ($scope.data.registrationRequest.sans[i].sanType == 'IP'){
            IPcount++;
            $scope.data.registrationRequest.sans[i].sanType += '.'+IPcount;
          }else if($scope.data.registrationRequest.sans[i].sanType == 'DNS'){
            DNScount++;
            $scope.data.registrationRequest.sans[i].sanType += '.'+DNScount;
          }
        }
        console.log($scope.data.registrationRequest.sans);
        
        $http.post("https://localhost:3300/", $scope.data).//"{request: "+$scope.request + "}"
      
        success(function(data, status, headers, config) {
          console.log("registration request send: " + data );
          //formular leeren
          $scope.san = false;
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
      $scope.DNSCount++;
      $scope.data.registrationRequest.sans.push({sanType:'', san: ''});
    };
  });