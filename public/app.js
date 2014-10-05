var app = angular.module("beerThink", ["ionic"]);

app.config([
    "$stateProvider", "$urlRouterProvider",
    function($stateProvider, $urlRouterProvider) {

      $stateProvider.state("beers", {
        url: "/beers",
        views: {
          "beers": {
            templateUrl: "beers.html",
            controller: "ListController"
          }
        }
      }).state("breweries", {
        url: "/breweries",
        views: {
          "breweries": {
            templateUrl: "breweries.html",
            controller: "ListController"
          }
        }
      }).state("nearby", {
        url: "/nearby",
        views: {
          "nearby": {
            templateUrl: "nearby.html",
            controller: "ListController"
          }
        }
      }).state("beers-detail", {
        url: "/beers/:item",
        views: {
          "beers": {
            templateUrl: "beer.html",
            controller: "ItemController"
          }
        }
      }).state("breweries-detail", {
        url: "/breweries/:item",
        views: {
          "breweries": {
            templateUrl: "brewery.html",
            controller: "ItemController"
          }
        }
      }).state("nearby-detail", {
        url: "/nearby/:item",
        views: {
          "nearby": {
            templateUrl: "brewery.html",
            controller: "ItemController"
          }
        }
      });

      $urlRouterProvider.otherwise("/beers");
}]);

app.controller("ItemController", [
  "$rootScope", "$scope", "$state", "$stateParams", 
  function($rootScope, $scope, $state, $stateParams) {
    var item = parseInt($stateParams.item);
    var kind = $state.$current.name.split("-")[0];
    $scope.item = $rootScope[kind].items[item];
}]);

app.controller("ListController", function($scope, $http) {
  $scope.items = [];
  var end = false;

  $scope.fetchMore = function() {
    if (end) return;

    var count = $scope.items.length;
    var params = count ? {"last":
      $scope.data.items[count-1].name} : {}

    $http.get("/beers", {params: params}).success(function(items) {
      if (items.length)
        Array.prototype.push.apply($scope.items, items);
      else end = true;
    }).error(function(err) {
      console.log("Failed to download list items:", err);
      end = true;
    }).finally(function() {
      $scope.$broadcast("scroll.infiniteScrollComplete");
    });
  };
});

app.controller("ListController", [
  "$rootScope", "$scope", "$state", "$http",
  function($rootScope, $scope, $state, $http) {

    if (!$rootScope.coordinates) {
      navigator.geolocation.getCurrentPosition(function(pos) {
        $rootScope.coords = pos.coords;
        console.log(pos.coords);
        if (kind == "nearby")
          $scope.fetchMore();
      });
    }

    var kind = $state.$current.name;
    if (!(kind in $rootScope))
      $rootScope[kind] = {items: [], end: false}
    $scope.data = $rootScope[kind];
    
    $scope.fetchMore = function() {
      if ($scope.data.end) return;
      
      if (kind == "nearby") {
        if (!$rootScope.coords) return;
        var args = $rootScope.coords;
        $scope.data.end = true;
      }
      else {
        var count = $scope.data.items.length;
        var args = count ? {"last": $scope.data.items[count-1].name} : {};
      }

      $http.get("/" + kind, {params: args})
      .success(function(items) {
        if (items.length)
          Array.prototype.push.apply($scope.data.items, items);
        else $scope.data.end = true;
      })
      .error(function(err) {
        console.log("Failed to download list items:", err);
        $scope.data.end = true;
      })
      .finally(function() {
        $scope.$broadcast("scroll.infiniteScrollComplete");
      })
    };
}]);

