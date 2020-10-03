'use strict';
var router = require("./router")
var { app } = require('../core')

module.exports = {
  async init(){
    app.use(router)
  }
}
