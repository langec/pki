angular.module('validation-ng', [])
  .controller('validationForm', function($scope, $http){
    getrequests();
    
    //liste per http get holen
    $scope.getrequests = getrequests();
    function getrequests() {
      //$http.get("http://localhost:4400/registrationrequests", $scope.id).
      $http.get("http://v22014102454821167.yourvserver.net:4400/registrationrequests", $scope.id).
          success(function(data, status, headers, config) {
            $scope.requests = data;
            console.log("got registration requests: " + data );
          }).
          error(function(data, status, headers, config) {
            console.log("didnt get registration requests: " + data);
          });
        
     };
    //###########################################   
    
    // 
    $scope.revoke = function(){
      console.log("revoke: " + $scope.revokeid.toString());
      //$http.post("http://localhost:8080/revokeCert/",$scope.revokeid.toString()).
      $http.post("http://h2418540.stratoserver.net:8080/revokeCert/",$scope.revokeid).
        success(function(data, status, headers, config) {
          alert("Cert revoked: " + data );
          console.log("Cert revoked: " + data );
        }).
        error(function(data, status, headers, config) {
          alert("Cert not revoked: " + data );
          console.log("Cert not revoked: " + data);
        });
    };
    
    $scope.approve = function(request) {
      console.log(JSON.stringify({id: request._id, allowed: true}));
      //$http.post("http://localhost:4400/approve/",JSON.stringify({id: request._id})).
      $http.post("http://v22014102454821167.yourvserver.net:4400/approve/",JSON.stringify({id: request._id})).
        success(function(data, status, headers, config) {
          console.log("registration request approved: " + data );
        }).
        error(function(data, status, headers, config) {
          console.log("registration request not approved: " + data);
        });
      getrequests();
    };
    
    $scope.reject = function(request) {
      //$http.post("http://localhost:4400/reject/", JSON.stringify({id: request._id})).
      $http.post("http://v22014102454821167.yourvserver.net:4400/reject/", JSON.stringify({id: request._id})).
        success(function(data, status, headers, config) {
          console.log("registration request rejected" + data );
        }).
        error(function(data, status, headers, config) {
          console.log("registration request not rejected: " + data);
        });
      getrequests();
    };
  });