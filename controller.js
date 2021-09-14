'use strict'

var QRCode = require('qrcode')
var path = require('path')
var fs = require('fs')
var util = require('util')
var readFile = util.promisify(fs.readFile)
var writeFile = util.promisify(fs.writeFile)
var tpl_path = process.env.NODE_ENV === 'development' ? path.join(__dirname, './voucher.tpl') : path.join('/etc', 'voucher.tpl')
var default_tpl_path = path.join(__dirname, './voucher-default.tpl')

function formatTime (minutes) {
  if (minutes < 60) return minutes + 'Mins.'
  if (minutes < 60 * 24) {
    var hrs = parseInt(minutes / 60)
    if (hrs < minutes / 60) {
      return hrs + 'Hr' + (hrs > 1 ? 's' : '') + '. : ' + (minutes - (hrs * 60)) + 'Mins.'
    } else {
      return hrs + 'Hr' + (hrs > 1 ? 's' : '') + '.'
    }
  }

  var days = parseInt((minutes / 60) / 24)
  if (days < (minutes / 60) / 24) {
    return days + 'D' + ' : ' + formatTime(minutes - days * 60 * 24)
  } else {
    return days + 'D'
  }
}

function formatData (mb) {
  if (mb < 1024) return mb + 'MB'
  return (mb / 1024).toFixed(2) + 'GB'
}

var rate_types = {time: 'Time', data: 'Data', time_or_data: 'Time/Data', subscription: 'Subscription'}

exports.generatePrintableVouchers = async (req, res, next) => {
  try {
    var {vouchers, opts} = req.body
    var {with_qr} = opts || {}
    try {
      var tpl = await readFile(tpl_path, 'utf8')
    } catch (e) {
      var tpl = await readFile(default_tpl_path, 'utf8')
    }

    vouchers = vouchers.sort((a, b) => a.batch_number - b.batch_number)
    var content = ''
    for (var i = 0; i < vouchers.length; i++) {
      var v = vouchers[i]
      var c = tpl.replace(/<batchnumber\s?>/gi, v.batch_number)
      c = c.replace(/<vouchercode\s?>/gi, v.code)
      c = c.replace(/<ratetype\s?>/gi, rate_types[v.type] || v.type)
      var rateval, exp
      switch (v.type) {
        case 'time':
          rateval = formatTime(v.minutes)
          exp = v.expiration_hours ? formatTime(v.expiration_hours * 60) : 'N/A'
          break
        case 'data':
          rateval = formatData(v.megabytes)
          exp = v.expiration_hours ? formatTime(v.expiration_hours * 60) : 'N/A'
          break
        case 'eload':
          rateval = v.eload_amount
          exp = v.expiration_hours ? formatTime(v.expiration_hours * 60) : 'N/A'
          break
        case 'time_or_data':
          rateval = formatTime(v.minutes) + ' / ' + formatData(v.megabytes)
          exp = v.expiration_hours ? formatTime(v.expiration_hours * 60) : 'N/A'
          break
        case 'subscription':
          rateval = 'N/A'
          exp = v.expiration_hours ? formatTime(v.expiration_hours * 60) : 'N/A'
          break
      }
      c = c.replace(/<eloadamount\s?>/gi, v.eload_amount || '')
      c = c.replace(/<minutes\s?>/gi, formatTime(v.minutes))
      c = c.replace(/<megabytes\s?>/gi, formatData(v.megabytes))
      c = c.replace(/<price\s?>/gi, v.price)
      c = c.replace(/<bandwidthdown\s?>/gi, (v.bandwidth_down_kbps / 1024).toFixed(2))
      c = c.replace(/<bandwidthup\s?>/gi, (v.bandwidth_up_kbps / 1024).toFixed(2))
      c = c.replace(/<ratevalue\s?>/gi, rateval || 'N/A')
      c = c.replace(/<maxuser\s?>/gi, v.max_users)

      c = c.replace(/<expiration\s?>/gi, exp || 'N/A')
      if (with_qr) {
        var qr = await QRCode.toDataURL(v.code)
        c = c.replace(/<qrcode\s?>/gi, '<img src="' + qr + '">')
      }
      content += c
    }

    if (!content) next('Something went wrong')

    res.send({ content })
  } catch (e) {
    console.log(e)
    next(e)
  }
}

exports.getSettings = async (req, res, next) => {
  try {
    var content = await readFile(tpl_path, 'utf8')
    res.json({content})
  } catch (e) {
    try {
      content = await readFile(default_tpl_path, 'utf8')
      res.json({content})
    } catch (e) {
      next(e)
    }
  }
}

exports.updateSettings = async (req, res, next) => {
  try {
    await writeFile(tpl_path, req.body.content)
    res.json({content: req.body.content})
  } catch (e) {
    next(e)
  }
}

exports.resetSettings = async (req, res, next) => {
  try {
    var content = await readFile(default_tpl_path, 'utf8')
    await writeFile(tpl_path, content)
    res.json({ content })
  } catch (e) {
    next(e)
  }
}
