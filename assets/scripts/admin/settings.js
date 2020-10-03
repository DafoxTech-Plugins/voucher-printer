(function () {
  'use strict';

  var App = angular.module('Plugins');
  App.config(function($stateProvider) {
    $stateProvider
    .state('plugins.voucher-printer', {
      templateUrl : "/plugins/voucher-printer/views/index.html",
      controller: 'VoucherPrinterSettingsCtrl',
      url: '/voucher-printer',
      title: 'Voucher Printer'
    });
  });
  App.service('PrinterSettingsService', [
    '$http',
    'toastr',
    'CatchHttpError',
    '$q',
    function($http, toastr, CatchHttpError, $q) {
      this.get = function () {
        return $http.get('/voucher-printer-settings').catch(CatchHttpError);
      }
      this.update = function (cfg) {
        return $http.post('/voucher-printer-settings', cfg).catch(CatchHttpError);
      }

      this.reset = function () {
        return $http.post('/voucher-printer-reset').catch(CatchHttpError);
      }
    }
  ]);

  App.controller('VoucherPrinterSettingsCtrl', function($scope, PrinterSettingsService, toastr){
    PrinterSettingsService.get().then(function(cfg){
      var data = cfg.data
      $scope.content = data.content
    })
    $scope.submit = function(){
      $scope.saving = true
      var cfg = {
        content: $scope.content
      }
      PrinterSettingsService.update(cfg).then(function(){
        toastr.success("Plugin settings successfully saved")
      }).finally(function(){
        $scope.saving = false
      })
    }

    $scope.resetSettings = function(){
      PrinterSettingsService.reset().then(function(res){
        $scope.content = res.data.content
        toastr.success("Plugin settings successfully reset")
      }).finally(function(){
        $scope.saving = false
      })
    }
  })
})();
