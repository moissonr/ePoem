var app = angular.module('ePoem', ['ionic', 'ngCordova'])

.run(function($ionicPlatform, $cordovaSQLite, Persistence) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
    Persistence.preload();
  });
});
