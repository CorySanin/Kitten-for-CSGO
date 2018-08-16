const server = require('./server.js').server
const player = require('./player.js').something
const ipc = require('electron').ipcRenderer
const shell = require('electron').shell
const fs = require('fs')
const path = require('path')
const os = require('os')
const VDF = require('@node-steam/vdf')
const registry = require('winreg')
const dirSep = (os.platform() == 'win32')?'\\':'/'

let state = {
  curPlayer: 1,
  state: '',
  audioDir: '',
  audioExt: '.meow'
}
