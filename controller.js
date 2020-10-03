'use strict';

var QRCode = require('qrcode')
var path = require("path")
var pdf_path = "/tmp/vouchers.pdf";
var fs = require("fs");
var util = require('util')
var readFile = util.promisify(fs.readFile)
var writeFile = util.promisify(fs.writeFile)
var tpl_path = path.join(__dirname, "./voucher.tpl")
var default_tpl_path = path.join(__dirname, "./voucher-default.tpl")

exports.generatePrintableVouchers = async(req, res, next)=>{
  try{
    var {vouchers, opts} = req.body
    var {with_qr} = opts || {}
    var tpl = await readFile(tpl_path, 'utf8')
    vouchers = vouchers.sort((a,b)=> a.batch_number - b.batch_number )
    var content = ""
    for(var i = 0; i < vouchers.length; i++){
      var v = vouchers[i]
      var c = tpl.replace(/\<batchnumber\s?\>/gi, v.batch_number)
      c = c.replace(/\<vouchercode\s?\>/gi, v.code)
      c = c.replace(/\<ratetype\s?\>/gi, v.type.toUpperCase())
      var rateval, exp;
      switch(v.type){
        case 'time':
          rateval = v.minutes +" Min.";
          exp = v.expiration_hours? ((v.minutes/60) + v.expiration_hours + "Hrs") : "N/A"
          break;
        case 'data':
          rateval = v.megabytes +" MB";
          exp = v.expiration_hours? (v.expiration_hours + "Hrs") : "N/A"
          break;
        case 'eload':
          rateval = v.eload_amount;
          break;
        case 'time_or_data':
          rateval = v.minutes +"Min. / "+ v.megabytes +"MB";
          exp = v.expiration_hours? ((v.minutes/60) + v.expiration_hours + "Hrs") : "N/A"
          break;
      }

      c = c.replace(/\<ratevalue\s?\>/gi, rateval)
      c = c.replace(/\<maxuser\s?\>/gi, v.max_users)

      c = c.replace(/\<expiration\s?\>/gi, exp)
      if(with_qr){
        var qr = await QRCode.toDataURL(v.code)
        c = c.replace(/\<qrcode\s?\>/gi, "<img src='"+qr+"'>")
      }
      content += c
    }

    if(!content) next("Something went wrong")

    res.send({ content })
  }catch(e){
    console.log(e)
    next(e)
  }
}

exports.getSettings = async(req, res, next)=>{
  try{
    var content = await readFile(tpl_path, 'utf8')
    res.json({content})
  }catch(e){
    next(e)
  }
}

exports.updateSettings = async(req, res, next)=>{
  try{
    await writeFile(tpl_path, req.body.content)
    res.json({content: req.body.content})
  }catch(e){
    next(e)
  }
}

exports.resetSettings = async(req, res, next)=>{
  try{
    var content = await readFile(default_tpl_path, 'utf8')
    await writeFile(tpl_path, content)
    res.json({ content })
  }catch(e){
    next(e)
  }
}
