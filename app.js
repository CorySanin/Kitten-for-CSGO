const server = require('./server.js')
const Player = require('./player.js').player
const ipc = require('electron').ipcRenderer
const shell = require('electron').shell
const fs = require('fs')
const path = require('path')
const os = require('os')
const VDF = require('@node-steam/vdf')
const registry = require('winreg')
const dirSep = (os.platform() === 'win32')?'\\':'/'

let settings = {
  port: '8793',
  volume: .5,
  mvp: true
}
let htEntities = {}
let state = {
  muteVol: 0
}
let player = new Player()

function doNothing(){
}

function genConfig(){

}

function updateVolume(){
  settings.volume = Math.max(state.muteVol,htEntities.volumeSlider.value)
  player.setVolume(htEntities.volumeSlider.value)
}

function toggleMvp(){
  settings.mvp = htEntities.mvpToggle.checked
}

function toggleMute(){
  if(state.muteVol === 0){
    state.muteVol = htEntities.volumeSlider.value
    htEntities.volumeSlider.value = 0
  }
  else{
    htEntities.volumeSlider.value = state.muteVol
    state.muteVol = 0
  }
  updateVolume()
}

function setEventHandlers(){
  htEntities.kitSelect.onchange = selectKit
  htEntities.volumeSlider.oninput = updateVolume
  htEntities.mvpToggle.onchange = toggleMvp
  htEntities.dirChange.onclick = newAudioDir
  htEntities.saveBtn.onclick = saveSettings
  htEntities.genConfig.onclick = genConfig
  htEntities.refreshKitsBtn.onclick = scanForKits
  htEntities.muteBtn.onclick = toggleMute
}

function doCommand(obj){
  if('type' in obj){
    if(obj['type'] === 'command'){
      if(!htEntities.mvpToggle.checked &&
        (obj['content'] === server.commands.MVP ||
         obj['content'] === server.commands.WIN ||
         obj['content'] === server.commands.LOSE)){
        player.play('😺')
      }
      else{
        player.play(obj['content'])
      }
    }
  }
}

function isDirectory(str){
  return fs.lstatSync(str).isDirectory()
}

function getNicePath(filename=null){
  if(filename == null){
    filename = state.audioDir
  }
  return filename + ((filename.endsWith(dirSep))?'':dirSep)
}

function getConfigFilename(){
  return path.join(state.audioDir,'config.json')
}

function selectKit(){
  settings.kit = htEntities.kitSelect.value
  let kit = path.join(state.audioDir,htEntities.kitSelect.value)
  let picture = path.join(kit, 'cover.jpg')
  fs.access(picture, fs.constants.F_OK, function(err){
    if(!err){
      htEntities.coverPic.src = picture
    }
    else{
      htEntities.coverPic.src = ''
    }
  })
  player.folder = path.join(state.audioDir,htEntities.kitSelect.value)
  player.loadTracks()
  server.start()
}

function scanForKits(){
  if(htEntities.kitSelect){
    htEntities.kitSelect.onchange = doNothing
    while(htEntities.kitSelect.options.length > 0){
      htEntities.kitSelect.options.remove(0)
    }
    fs.readdir(state.audioDir, function(err, files){
      files = files.map(function(name){
        return path.join(state.audioDir, name)
      }).filter(isDirectory)
      files.forEach(function(kitDir) {
        let dir = kitDir.split(dirSep)
        dir = dir[dir.length -1]
        let op = document.createElement('OPTION')
        op.text = dir
        op.value = dir
        if(dir === settings.kit){
          op.selected = true
        }
        htEntities.kitSelect.options.add(op)
      })
      setEventHandlers()
      selectKit()
    })
  }
}

function saveSettings(){
  if(settings.port !== htEntities.portNum.value){
    settings.port = htEntities.portNum.value
    server.changePort(settings.port)
  }
  try{
    if(state.audioDir){
      localStorage.setItem('audioDir',state.audioDir)
      if(settings){
        fs.writeFile(getConfigFilename(), JSON.stringify(settings), 'utf8', doNothing)
      }
    }
  }
  catch(err){
    console.log(err)
  }
  genConfig()
}

function newAudioDir(){
  ipc.send('open-kitten-dir','selected-directory')
}

function loadSettingsIntoDom(){
  htEntities.mvpToggle.checked = settings.mvp
  htEntities.portNum.value = settings.port
  htEntities.volumeSlider.value = settings.volume
  updateVolume()
}

function tryLoadSettings(){
  if(state.audioDir == null){
    let msg = 'You must select a directory to store everything in. '
    msg += 'This is also where Kitten looks for music kits.'
    ipc.send('dialog', msg, 'Welcome!', 'welcome-message-done')
  }
  else{
    try{
      fs.readFile(getConfigFilename(), 'utf8', function(err, data){
        if(!err){
          settings = JSON.parse(data)
          server.changePort(settings.port)
          loadSettingsIntoDom()
          scanForKits()
        }
        saveSettings()
      })
    }
    catch(e){
      saveSettings()
    }
  }
}

function getHtEntities(){
  htEntities.kitSelect = document.getElementById('kit')
  htEntities.volumeSlider = document.getElementById('volSlider')
  htEntities.mvpToggle = document.getElementById('mvpToggle')
  htEntities.portNum = document.getElementById('portNum')
  htEntities.dirChange = document.getElementById('dirChange')
  htEntities.saveBtn = document.getElementById('saveBtn')
  htEntities.genConfig = document.getElementById('genConfig')
  htEntities.refreshKitsBtn = document.getElementById('refreshKitsBtn')
  htEntities.muteBtn = document.getElementById('muteBtn')
  htEntities.coverPic = document.getElementById('coverPic')
}

function init(){
  console.log('Music Kitten for CS:GO\nVersion [$VERSION$]\nBy Cory Sanin')
  getHtEntities()

  state.audioDir = localStorage.getItem('audioDir')
  server.changeCallback(doCommand)

  tryLoadSettings()
}

window.onload = init

ipc.on('welcome-message-done', newAudioDir)

//executes when the selected directory dialog is completed
ipc.on('selected-directory', function(event, path){
  if(path.length > 0){
    state.audioDir = path[0]
    tryLoadSettings()
  }
  else if(state.audioDir == null){
    let msg = 'A configuration directory must be chosen.'
    ipc.send('dialog', msg, 'Hey!', 'welcome-message-done')
  }
})
