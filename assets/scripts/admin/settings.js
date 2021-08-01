(function () {
  'use strict'

  var App = angular.module('Plugins')
  App.config(function ($stateProvider) {
    $stateProvider.state('plugins.voucher-printer', {
      templateUrl: '/public/plugins/voucher-printer/views/index.html',
      controller: 'VoucherPrinterSettingsCtrl',
      url: '/voucher-printer',
      title: 'Voucher Printer'
    })
  })
  App.service('PrinterSettingsService', [
    '$http',
    'toastr',
    'CatchHttpError',
    '$q',
    function ($http, toastr, CatchHttpError, $q) {
      this.get = function () {
        return $http.get('/voucher-printer-settings').catch(CatchHttpError)
      }
      this.update = function (cfg) {
        return $http.post('/voucher-printer-settings', cfg).catch(CatchHttpError)
      }

      this.reset = function () {
        return $http.post('/voucher-printer-reset').catch(CatchHttpError)
      }
    }
  ])

  App.controller('VoucherPrinterSettingsCtrl', function ($scope, $sce, PrinterSettingsService, toastr) {
    PrinterSettingsService.get().then(function (cfg) {
      var data = cfg.data
      $scope.content = data.content
    })
    $scope.submit = function () {
      $scope.saving = true
      var cfg = {
        content: $scope.content
      }
      PrinterSettingsService.update(cfg).then(function () {
        toastr.success('Plugin settings successfully saved')
      }).finally(function () {
        $scope.saving = false
      })
    }

    $scope.previewVoucherQR = function () {
      return $scope.previewVoucher(true)
    }

    $scope.previewVoucher = function (withQr) {
      var preview = angular.copy($scope.content)
      if (!preview) return ''
      preview = preview.replace(/<batchnumber\s?>/gi, '5')
      preview = preview.replace(/<ratetype\s?>/gi, 'Time')
      preview = preview.replace(/<ratevalue\s?>/gi, '2hrs.')
      if (withQr) {
        preview = preview.replace(/<qrcode\s?>/gi, '<img src="/public/plugins/voucher-printer/assets/images/qr.png" style="width:60%;margin:10px"></img>')
      } else {
        preview = preview.replace(/<qrcode\s?>/gi, '')
      }
      preview = preview.replace(/<maxuser\s?>/gi, '1')
      preview = preview.replace(/<expiration\s?>/gi, '1D')
      preview = preview.replace(/<price\s?>/gi, '10')
      preview = preview.replace(/<bandwidthdown\s?>/gi, '10MB')
      preview = preview.replace(/<bandwidthup\s?>/gi, '10MB')
      preview = preview.replace(/<vouchercode\s?>/gi, 'DF123121')
      return $sce.trustAsHtml(preview)
    }

    $scope.resetSettings = function () {
      PrinterSettingsService.reset().then(function (res) {
        $scope.content = res.data.content
        toastr.success('Plugin settings successfully reset')
      }).finally(function () {
        $scope.saving = false
      })
    }
  })
})()
