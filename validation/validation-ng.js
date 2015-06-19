angular.module('validation-ng', [])
  .controller('validationForm', function($scope, $http){
    getrequests();
    
    //liste per http get holen
    $scope.getrequests = getrequests();
    function getrequests() {
      $http.get("http://localhost:4400/registrationrequests", $scope.id).
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
    
    $scope.approve = function(request) {
      console.log(JSON.stringify({id: request._id, allowed: true}));
      $http.post("http://localhost:4400/approve/",JSON.stringify({id: request._id})).
        success(function(data, status, headers, config) {
          console.log("registration request approved: " + data );
        }).
        error(function(data, status, headers, config) {
          console.log("registration request not approved: " + data);
        });
      getrequests();
    };
    
    $scope.reject = function(request) {
      $http.post("http://localhost:4400/reject/", JSON.stringify({id: request._id})).
        success(function(data, status, headers, config) {
          console.log("registration request rejected" + data );
        }).
        error(function(data, status, headers, config) {
          console.log("registration request not rejected: " + data);
        });
      getrequests();
    };
  });