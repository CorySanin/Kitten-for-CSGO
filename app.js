const server = require('./server.js')
const Player = require('./player.js').player
const saveConfig = require('./gamestateIntegration.js').saveConfig
const ipc = require('electron').ipcRenderer
const shell = require('electron').shell
const fs = require('fs-extra')
const download = require('download')
const decompress = require('decompress')
const path = require('path')
const os = require('os')
const doNothing = function(){
}

let settings = {
  port: '8793',
  volume: .5,
  mainmenu: true,
  startround: true,
  bombplanted: true,
  mvp: true,
  discordrichpresence: false
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
    htEntities.body.classList.remove('expanded')
  }
  else{
    ipc.send('resize', {
      width:760
    })
    htEntities.body.classList.add('expanded')
  }
  expanded = !expanded
}

function collapseAll(){
  if(!htEntities.preview.div.classList.value.includes('none')){
    htEntities.preview.div.classList.add('none')
  }
  if(!htEntities.settingsPane.classList.value.includes('none')){
    htEntities.settingsPane.classList.add('none')
  }
}

function togglePreview(){
  let showing = !htEntities.preview.div.classList.value.includes('none')
  if(showing){
    toggleExpanded()
    htEntities.preview.div.classList.add('none')
  }
  else{
    collapseAll()
    if(!expanded){
      toggleExpanded()
    }
    htEntities.preview.div.classList.remove('none')
  }
}

function toggleSettingsPane(){
  let showing = !htEntities.settingsPane.classList.value.includes('none')
  if(showing){
    toggleExpanded()
    htEntities.settingsPane.classList.add('none')
  }
  else{
    collapseAll()
    if(!expanded){
      toggleExpanded()
    }
    htEntities.settingsPane.classList.remove('none')
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

function toggleSetting(){
  settings[this.value] = this.checked
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

function dropHandler(e) {
  let zipPath = e.dataTransfer.files[0].path
  if(isDirectory(state.audioDir)){
    let destDirectory = path.join(
      state.audioDir,
      path.basename(
        zipPath,
        path.extname(zipPath)
      )
    )
    if(!isDirectory(destDirectory)){
      fs.mkdir(destDirectory)
      decompress(zipPath, destDirectory, {
        strip:1
      }).then(
        function(files){
          if(files.length === 0){
            fs.unlink(destDirectory, function(err){
              if(err){
                console.log('Can\'t delete the folder for some stupid reason. Sorry, I tried.')
              }
              scanForKits()
            })
          }
          else{
            scanForKits()
          }
        }
      )
    }
    else{
      ipc.send('dialog', 'A directory with that name already exists in your music kit folder', 'Error')
    }
  }
  overlayDown()
}

function overlayUp(e){
  htEntities.addKitsOverlay.style.display = 'block'
}

function overlayDown(e){
  htEntities.addKitsOverlay.style.display = 'none'
}

function setEventHandlers(){
  let toggles = document.getElementsByClassName('settingstoggle')
  for(let i = 0; i < toggles.length; i++){
    toggles[i].onclick = toggleSetting
  }
  htEntities.kitSelect.onchange = selectKit
  htEntities.volumeSlider.oninput = updateVolume
  htEntities.dirChange.onclick = newAudioDir
  htEntities.saveBtn.onclick = saveSettings
  htEntities.refreshKitsBtn.onclick = scanForKits
  htEntities.muteBtn.onclick = toggleMute
  htEntities.previewBtn.onclick = togglePreview
  htEntities.settingsBtn.onclick = toggleSettingsPane

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

  //unzip-feature
  htEntities.body.ondragover = (ev) => {
    overlayUp(ev)
  }

  htEntities.addKitsOverlay.ondragover = (ev) => {
    ev.preventDefault()
  }

  htEntities.addKitsOverlay.ondragend =
  htEntities.addKitsOverlay.ondragleave =
  htEntities.addKitsOverlay.ondragexit = (ev) => {
    overlayDown(ev)
  }

  htEntities.addKitsOverlay.ondrop = (ev) => {
    dropHandler(ev)
  }
}

function doCommand(obj){
  if('type' in obj){
    if(obj['type'] === 'command'){
      if((!settings.mvp &&
        (obj['content'] === server.commands.MVP ||
         obj['content'] === server.commands.WIN ||
         obj['content'] === server.commands.LOSE)) ||
        (!settings.mainmenu &&
         obj['content'] === server.commands.MENU) ||
        (!settings.startround &&
         (obj['content'] === server.commands.FREEZETIME ||
          obj['content'] === server.commands.LIVE)) ||
        (!settings.bombplanted &&
         obj['content'] === server.commands.PLANTED)){
        player.play('😺')
      }
      else{
        player.play(obj['content'])
      }
    }
  }
}

function isDirectory(str){
  try{
    return fs.lstatSync(str).isDirectory()
  }
  catch(err){
    return false
  }
}

function getConfigFilename(){
  return path.join(state.audioDir,'config.json')
}

function getCover(folder){
  let placeholder = 'icon/icon_512.png'
  htEntities.coverPic.src = placeholder
  fs.readdir(folder, function(err, files){
    let cover = placeholder
    if(!err){
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
  htEntities.header.innerHTML = (settings.kit === '')?'Music Kitten':settings.kit
  let kit = path.join(state.audioDir,htEntities.kitSelect.value)
  getCover(kit)
  player.folder = kit
  player.loadTracks()
  server.start()
}

function noKits(){
  ipc.send('yes-no',
           'No kits were found in that directory. Would you like to download the sample kit?',
           'No kits found',
           'no-kits-response'
          )
}

function scanForKits(){
  if(!htEntities.kitSelect){
    getHtEntities()
  }
  if(htEntities.kitSelect){
    htEntities.kitSelect.onchange = doNothing
    while(htEntities.kitSelect.options.length > 0){
      htEntities.kitSelect.options.remove(0)
    }
    fs.readdir(state.audioDir, function(err, files){
      files = files.map(function(name){
        return path.join(state.audioDir, name)
      }).filter(isDirectory)
      if(files.length === 0){
        noKits()
      }
      else{
        files.forEach(function(kitDir, i) {
          let dir = path.basename(kitDir)
          let op = document.createElement('OPTION')
          op.text = dir
          op.value = dir
          htEntities.kitSelect.options.add(op)
          if(dir === settings.kit){
            htEntities.kitSelect.options.selectedIndex = i
          }
        })
      }
      setEventHandlers()
      selectKit()
    })
  }
}

function resetDirectory(){
  localStorage.removeItem('audioDir')
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
  let toggles = document.getElementsByClassName('settingstoggle')
  for (let i = 0; i < toggles.length; i++) {
    toggles[i].checked = toggles[i].value in settings && settings[toggles[i].value]
  }

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
          data = JSON.parse(data)
          for(let key in data){
            settings[key] = data[key]
          }
          server.changePort(settings.port)
          loadSettingsIntoDom()
        }
        saveSettings()
        scanForKits()
      })
    }
    catch(e){
      saveSettings()
      scanForKits()
    }
  }
}

function getHtEntities(){
  htEntities.body = document.getElementsByTagName('body')[0]
  htEntities.kitSelect = document.getElementById('kit')
  htEntities.volumeSlider = document.getElementById('volSlider')
  htEntities.portNum = document.getElementById('portNum')
  htEntities.previewBtn = document.getElementById('previewKit')
  htEntities.settingsBtn = document.getElementById('settingsBtn')
  htEntities.dirChange = document.getElementById('dirChange')
  htEntities.saveBtn = document.getElementById('saveBtn')
  htEntities.refreshKitsBtn = document.getElementById('refreshKitsBtn')
  htEntities.muteBtn = document.getElementById('muteBtn')
  htEntities.coverPic = document.getElementById('coverPic')
  htEntities.header = document.getElementById('h1')
  htEntities.settingsPane = document.getElementById('extrasettings')
  htEntities.discordrp = document.getElementById('discordrichpresence')

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

  //unzip-feature
  htEntities.addKitsOverlay = document.getElementById('dragDropOverlay')


  setEventHandlers()
  server.richpresence.setDiscordToggle(htEntities.discordrp)
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

ipc.on('no-kits-response', function(event, yesplease){
  if(yesplease){
    htEntities.body.classList.add('loading')
    download('https://www.musickitten.net/kits/1/Deep_in_Thot.zip',
             path.join(state.audioDir, 'Deep in Thot'),
             {extract:true}
            ).then(() => {
      htEntities.body.classList.remove('loading')
      scanForKits()
    })
  }
})
