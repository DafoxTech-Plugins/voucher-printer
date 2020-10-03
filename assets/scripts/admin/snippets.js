(function () {
  'use strict';
  var App;
  try{
    App = angular.module("AdoPiSoft");
  }catch(e){
    App = angular.module("adopisoft");
  }
  var selector = '[ng-controller="VouchersCtrl"] .vouchers-table [ng-change="updateAllSelect(this)"]'
  selector += ', [ng-controller="VouchersCtrl"] .vouchers-table [ng-change="selectAll()"]'
  var $scope, $injector, initialized = false
  $(document).on("change", selector, function(){
    if( initialized && $(".print-btn").length ) return;
    var el = angular.element(".vouchers-table");
    $scope = el.scope()
    $injector = el.injector()
    $injector.invoke(function($rootScope, $compile, VoucherPrinterService, CatchHttpError, $timeout) {
      function print(vouchers, opts){
        $("body .to-print").remove()
        VoucherPrinterService.generatePrintableVouchers(vouchers, opts||{}).then(function(res){
          $("#http-spinner").show();
          $("body div:visible").addClass("no-print")
          var content = res.data.content
          var div = document.createElement('div');
          div.classList.add("to-print")
          div.innerHTML = content
          var o_title = document.title
          $("body").append(div)
          $timeout(function(){
            document.title = "vouchers.pdf"
            $("#http-spinner").hide();
            window.print();
            $("body div.no-print").removeClass("no-print")
            document.title = o_title
          },3000)
        }).catch(CatchHttpError)
      }

      $rootScope.printVouchers = function(){
        var vouchers = $scope.selectedVouchers()
        return print(vouchers)
      }
  
      $rootScope.printVouchersWithQr = function(){
        var vouchers = $scope.selectedVouchers()
        return print(vouchers, {with_qr: true})
      }

      $rootScope.selectedVouchers = $scope.selectedVouchers

      $('[ng-controller="VouchersCtrl"] .top-buttons').append($compile(
      '<div class="btn-group dropdown print-btn" uib-dropdown style="" ng-show="selectedVouchers().length">'+
        '<button id="voucher-print" type="button" class="btn btn-success ng-binding" ng-click="printVouchers()">'+
          '<i class="fa fa-print">&nbsp;</i>'+
          "Print Vouchers"+
        "</button>"+
        '<button type="button" class="btn btn-success" uib-dropdown-toggle>'+
          '<span class="caret"></span>'+
        '</button>'+
        '<ul class="dropdown-menu" uib-dropdown-menu="" role="menu" aria-labelledby="voucher-print">'+
          '<li role="menuitem"><a ng-click="printVouchersWithQr()">+ QR Codes</a></li>'+
        "</ul>"+
      "</div>"
      )($rootScope));
    });
    initialized = true;
  })

  App.service('VoucherPrinterService', [
    '$http',
    'toastr',
    'CatchHttpError',
    '$q',
    function($http, toastr, CatchHttpError, $q) {

      this.generatePrintableVouchers = function (vouchers, opts) {
        return $http.post('/generate-printable-vouchers', { vouchers: vouchers, opts: opts })
      }
    }
  ])

  var style = document.createElement('style');
  style.textContent = "@media print {"+
                      " .to-print{"+
                      "   display: block;"+
                      "   margin: 0 auto;"+
                      " }"+
                      " .no-print{"+
                      "   display: none;"+
                      " }"+
                      "}"+
                      "@media not print {"+
                      " .to-print{"+
                      "   display: inline-block;"+
                      "   width:1px !important;"+
                      "   height:1px  !important;"+
                      "   overflow: hidden;"+
                      " }"+
                      "}";

  document.head.append(style);
})();
