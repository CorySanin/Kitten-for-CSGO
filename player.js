const ipc = require('electron').ipcRenderer
const fs = require('fs')
const path = require('path')
//const shell = require('electron').shell
const os = require('os')

let isDirectory = null
let getDirectories = null
let getFiles = null

let kitSelect = null
let curPlayer = 1
let state = ''
let dirSep = '/'
let audioDir = ''
let audioExt = '.meow'
let roundActionFlag = false
let roundActionPlayer = null
let bombPlantFlag = false

ipc.on('message', function (event, message) {
  console.log(`Message from main: ${message}`)
})

ipc.on('command', function (event, message) {
  console.log(message)
  doCommand(message)
})

function init(){
  kitSelect = document.getElementById('kit')

  if(os.platform() == 'win32'){
    dirSep = '\\'
  }

  audioDir = 'audio'+dirSep

  //event listeners
  document.getElementById('volSlider').oninput = function(){
    let curplay = getCurPlayer()
    if(curplay != null)
      curplay.volume = document.getElementById('volSlider').value
  }
  //end event listeners

  //from https://stackoverflow.com/a/24594123/1317558
  isDirectory = source => fs.lstatSync(source).isDirectory()
  getDirectories = source =>
    fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)

  getFiles = source =>
    fs.readdirSync(source).map(name => path.join(source, name)).filter
    (source => !fs.lstatSync(source).isDirectory())

  getDirectories(audioDir).forEach(function(element) {
    let dir = element.split(dirSep)
    dir = dir[dir.length -1]
    let op = document.createElement('OPTION')
    op.text = dir
    op.value = element
    kitSelect.options.add(op)
  })
}

//returns the volume to be used by all audio elements
function getVolume(){
  return document.getElementById('volSlider').value
}

//returns the current audio player
function getCurPlayer(){
  let elId = null
  if(curPlayer){
    elId = 'player1'
  }
  else {
    elId = 'player0'
  }
  return document.getElementById(elId)
}

//sets up and returns the next audio player.
//src: the audio to play
function getPlayer(src){
  let elId = null
  if(curPlayer){
    curPlayer = 0
    elId = 'player0'
  }
  else {
    curPlayer++
    elId = 'player1'
  }
  let containerEl = document.getElementById(elId+'Holder')

  containerEl.innerHTML = '<audio id="'+elId+'">'
  containerEl.innerHTML += '</audio>'

  let srcel = document.createElement('SOURCE')
  srcel.src = src.replace(/\\/g,'/')

  let plyr = document.getElementById(elId)
  plyr.volume = getVolume()

  plyr.appendChild(srcel)

  return document.getElementById(elId)
}

function getKitPath(){
  let files = getFiles(kitSelect.value)
  let exts = []
  for(let i=0; i<files.length; i++){
    let ext = files[i].split('.')
    ext = ext[ext.length - 1]
    if(typeof exts[ext] !== 'undefined'){
      audioExt = '.'+ext
      break
    }
    else{
      exts[ext] = 1
    }
  }

  return kitSelect.value + dirSep
}

function doCommand(message){
  if(message != state){
    if(message == 'mvp'){
      fadeOut(getCurPlayer(),500)
      let player = getPlayer(getKitPath()+'roundmvpanthem_01'+audioExt)
      player.oncanplay = function(){
        player.play()
      }
      player.load()
      message = 'win'
    }
    else if (message == 'freezetime') {
      fadeOut(getCurPlayer(),500)
      let roundnum = Math.floor((Math.random() * 3) + 1)
      roundActionFlag = true
      loopAudio('startround_0'+roundnum,message,true,function(){
        if(state == 'live'){
          let liveplayer = getPlayer(getKitPath()+'startaction_0'+roundnum+audioExt)
          liveplayer.oncanplay = function(){
            if(roundActionFlag)
              liveplayer.play()
          }
          liveplayer.load
        }
      })
    }
    else if (message == 'live') {
      if(state == 'menu'){
        fadeOut(getCurPlayer(),1000)
      }
      else if(state == 'mvp'|| state == 'win' || state == 'lose'){
        message = state
      }
      if(roundActionFlag){

        setTimeout(function(){
          roundActionFlag = false
          fadeOut(getCurPlayer(),3500)
        },8500)
      }
    }
    else if (message == 'menu'){
      fadeOut(getCurPlayer(),500)
      loopAudio('mainmenu',message,true,function(){
      })
    }
    else if (message == 'win' || message == 'lose') {
      fadeOut(getCurPlayer(),500)
      let roundendtrack = (message == 'win')?'wonround':'lostround'
      let player = getPlayer(getKitPath()+roundendtrack+audioExt)
      player.oncanplay = function(){
        player.play()
      }
      player.load()
    }
    else if (message == 'planted' && state != '10sec'){
      loopAudio('bombplanted',message,false,function(){
        if(state == '10sec'){
          bombPlantFlag = false
          let player = getPlayer(getKitPath()+'bombtenseccount'+audioExt)
          player.oncanplay = function(){
            player.play()
          }
          player.load()
        }
      })
      let offset = 30000
      setTimeout(function(){
        if(state == message){
          state = '10sec'
          bombPlantFlag = true
        }
      },offset)//start 10 second countdown in 30 seconds
    }
    else if(state == '10sec'){
      if(bombPlantFlag)
        message = state
    }
    state = message
  }
}

function loopAudio(audfile,loopstate,doFadeIn,func){
  let player = getPlayer(getKitPath()+audfile+audioExt)
  player.oncanplay = function(){
    setTimeout(function(){
      if(state == loopstate){
        loopAudio(audfile,loopstate,false,func)
      }
      else{
        func()
      }
    },player.duration * 1000 - 25)
    if(doFadeIn){
      fadeIn(player)
    }
    player.play()
  }
  player.load()
}

//heavily inspired by fade.js by miohtama
//ramp() is is almost identical to original implementation
//https://github.com/miohtama/Krusovice/blob/master/src/tools/fade.js
function fadeOut(player,timeToFade){
  if(player != null){
    let oVol = player.volume
    if(oVol != 0){
      let tick = 50

      let volumeStep = oVol / (timeToFade / tick)

      function ramp() {
        let vol = Math.max(0, player.volume - volumeStep)

        player.volume = vol

        if(player.volume > 0) {
          setTimeout(ramp, tick)
        } else {
          player.pause()
          player.volume = oVol
        }
      }
      ramp()
    }
  }
}

//starts volume at 0 and goes up to full volume
//modified from fadeOut()
//Thanks again to miohtama for fade.js
function fadeIn(player){
  if(player != null){
    player.volume = 0
    let destination = getVolume()
    let timeToFade = 1000
    let tick = 50

    let volumeStep = destination / (timeToFade / tick)

    function ramp() {
      let vol = Math.min(destination, player.volume + volumeStep)

      player.volume = vol

      // Have we reached target volume level yet?
      if(player.volume < destination) {
        setTimeout(ramp, tick)
      }
    }
    ramp()
  }
}
