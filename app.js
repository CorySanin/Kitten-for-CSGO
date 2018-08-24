const Server = require('./server.js').server
const Player = require('./player.js').player
const ipc = require('electron').ipcRenderer
const shell = require('electron').shell
const fs = require('fs')
const path = require('path')
const os = require('os')
const VDF = require('@node-steam/vdf')
const registry = require('winreg')
const dirSep = (os.platform() === 'win32')?'\\':'/'

let settings = {}
let htEntities = {}
let state = {}
let player// = new Player({})
let server// = new Server({})

function tryLoadSettings(){
  if(state.audioDir == null){
    let msg = 'You must select a directory to store everything in. '
    msg += 'This is also where Kitten looks for music kits.'
    ipc.send('dialog', msg, 'Welcome!', 'welcome-message-done')
  }
  else{
    try{
      fs.readFile(state.audioDir, 'utf8', function(err, data){
        if(err){
          throw err
        }
        state.audioDir = JSON.parse(data)
      })
    }
    catch{
      state.audioDir = null
      tryLoadSettings()
    }
  }
}

function getHtEntities(){
  htEntities.kitSelect = document.getElementById('kit')
  htEntities.volumeSlider = document.getElementById('volSlider')
  htEntities.mvpToggle = document.getElementById('mvpToggle')
  htEntities.portNum = document.getElementById('portNum')
  htEntities.dirChange = document.getElementById('dirChange')
  htEntities.aveBtn = document.getElementById('saveBtn')
  htEntities.genConfig = document.getElementById('genConfig')
  htEntities.refreshKitsBtn = document.getElementById('refreshKitsBtn')
  htEntities.muteBtn = document.getElementById('muteBtn')
}

function init(){
  console.log('Music Kitten for CS:GO\nVersion [$VERSION$]\nBy Cory Sanin')
  getHtEntities()

  state.audioDir = localStorage.getItem('audioDir')

  tryLoadSettings()
}

window.onload = init
