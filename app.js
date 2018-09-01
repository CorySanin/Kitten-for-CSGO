const server = require('./server.js')
const Player = require('./player.js').player
const saveConfig = require('./gamestateIntegration.js').saveConfig
const ipc = require('electron').ipcRenderer
const shell = require('electron').shell
const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const dirSep = (os.platform() === 'win32')?'\\':'/'
const doNothing = function(){
}

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
let expanded = false

function toggleExpanded(){
  if(expanded){
    ipc.send('resize', {
      width:380
    })
  }
  else{
    ipc.send('resize', {
      width:760
    })
  }
  expanded = !expanded
}

function togglePreview(){
  toggleExpanded()
  if(expanded){
    htEntities.body.classList.add('expanded')
    htEntities.preview.div.classList.remove('none')
  }
  else{
    htEntities.body.classList.remove('expanded')
    htEntities.preview.div.classList.add('none')
  }
}

function genConfig(){
  saveConfig({
    url: server.getUrl(),
    heartbeat: server.getHeartbeat(),
    token: server.getAuth()
  })
}

function updateVolume(){
  settings.volume = Math.max(state.muteVol,htEntities.volumeSlider.value)
  player.setVolume(htEntities.volumeSlider.value)
}

function toggleMvp(){
  settings.mvp = htEntities.mvpToggle.checked
}

function toggleMute(){
  if(Number.parseFloat(htEntities.volumeSlider.value) === 0){
    if(state.muteVol === 0){
      htEntities.volumeSlider.value = .5
    }
    else{
      htEntities.volumeSlider.value = state.muteVol
    }
    state.muteVol = 0
  }
  else{
    state.muteVol = htEntities.volumeSlider.value
    htEntities.volumeSlider.value = 0
  }
  updateVolume()
}

function previewBtnClick(){
  player.play(this.value)
}

function previewFreezetime(){
  player.playFreezetime(this.value)
}

function setEventHandlers(){
  htEntities.kitSelect.onchange = selectKit
  htEntities.volumeSlider.oninput = updateVolume
  htEntities.mvpToggle.onchange = toggleMvp
  htEntities.dirChange.onclick = newAudioDir
  htEntities.saveBtn.onclick = saveSettings
  htEntities.refreshKitsBtn.onclick = scanForKits
  htEntities.muteBtn.onclick = toggleMute
  htEntities.previewBtn.onclick = togglePreview

  //preview elements
  htEntities.preview.menu.onclick = htEntities.preview.freezetime.onclick =
      htEntities.preview.live.onclick = htEntities.preview.planted.onclick =
      htEntities.preview.mvp.onclick = htEntities.preview.win.onclick =
      htEntities.preview.lose.onclick = htEntities.preview.stop.onclick =
        previewBtnClick
  htEntities.preview.freezetime1.onclick =
      htEntities.preview.freezetime2.onclick =
      htEntities.preview.freezetime3.onclick =
        previewFreezetime
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

function getCover(folder){
  let placeholder = 'icon/icon_512.png'
  htEntities.coverPic.src = placeholder
  fs.readdir(folder, function(err, files){
    let cover
    if(err){
      cover = placeholder
    }
    else{
      files.forEach(function(file){
        let split = file.split('.')
        if(split.length === 2 && split[0].toLowerCase() === 'cover'){
          cover = path.join(folder, file)
        }
      })
    }
    htEntities.coverPic.src = cover
  })
}

function selectKit(){
  settings.kit = htEntities.kitSelect.value
  let kit = path.join(state.audioDir,htEntities.kitSelect.value)
  getCover(kit)
  player.folder = kit
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
  htEntities.body = document.getElementsByTagName('body')[0]
  htEntities.kitSelect = document.getElementById('kit')
  htEntities.volumeSlider = document.getElementById('volSlider')
  htEntities.mvpToggle = document.getElementById('mvpToggle')
  htEntities.portNum = document.getElementById('portNum')
  htEntities.previewBtn = document.getElementById('previewKit')
  htEntities.dirChange = document.getElementById('dirChange')
  htEntities.saveBtn = document.getElementById('saveBtn')
  htEntities.refreshKitsBtn = document.getElementById('refreshKitsBtn')
  htEntities.muteBtn = document.getElementById('muteBtn')
  htEntities.coverPic = document.getElementById('coverPic')

  //preview elements
  htEntities.preview = {
    div: document.getElementById('preview'),
    menu: document.getElementById('menuPreview'),
    freezetime: document.getElementById('freezetimePreview'),
    freezetime1: document.getElementById('freezetime1Preview'),
    freezetime2: document.getElementById('freezetime2Preview'),
    freezetime3: document.getElementById('freezetime3Preview'),
    live: document.getElementById('livePreview'),
    planted: document.getElementById('plantedPreview'),
    mvp: document.getElementById('mvpPreview'),
    win: document.getElementById('winPreview'),
    lose: document.getElementById('losePreview'),
    stop: document.getElementById('stopPreview')
  }
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
