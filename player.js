/*global Howl, Howler */
const os = require('os')
const fs = require('fs')
const path = require('path')
const COMMANDS = require('./server.js').commands
const dirSep = (os.platform() === 'win32')?'\\':'/'
const audiofiles = [
  'bombplanted',
  'bombtenseccount',
  'lostround',
  'mainmenu',
  'roundmvpanthem_01',
  'startaction_01',
  'startaction_02',
  'startaction_03',
  'startround_01',
  'startround_02',
  'startround_03',
  'wonround'
]

class KittenPlayer{

  constructor(ops={}){
    this.current = null
    this.command = null
    this.folder = ('folder' in ops)?ops.folder:''
    this.volume = ('volume' in ops)?Number.parseFloat(ops.volume):.5
    this.tracks = {}
  }

  loadTracks(){
    let tracks = this.tracks
    let that = this
    let playWhenDone = (this.current && this.current.playing())?this.command:false

    let onfade = function(p){
      return function(id){
        if(p.stopping){
          p.stop()
          p.stopping = false
          if(p === this.current){
            that.current = null
            that.command = null
          }
        }
      }
    }

    if(this.folder){
      let track
      for(track in tracks) {
        tracks[track].unload()
      }

      let fileExt = []
      let files = fs.readdirSync(this.folder)
      files.forEach(function(file){
        let split = file.split('.')
        if(split.length === 2 && audiofiles.includes(split[0])){
          fileExt[split[0]] = '.'+split[split.length-1]
        }
      })

      tracks[COMMANDS.MENU] = new Howl({
        src: [this.getFileName('mainmenu'+fileExt['mainmenu'])],
        loop: true,
        volume: this.volume
      })

      tracks[COMMANDS.MVP] = new Howl({
        src: [this.getFileName('roundmvpanthem_01'+fileExt['roundmvpanthem_01'])],
        loop: true, //not sure if it shoule loop or not ?
        volume: this.volume
      })

      for(let i=1; i<=3; i++){
        tracks[COMMANDS.LIVE+i] = new Howl({
          src: [this.getFileName('startaction_0'+i+fileExt['startaction_0'+i])],
          loop: false,
          volume: this.volume
        })

        tracks[COMMANDS.FREEZETIME+i] = new Howl({
          src: [this.getFileName('startround_0'+i+fileExt['startround_0'+i])],
          loop: true,
          volume: this.volume,
          onend(id){
            let startaction = tracks[COMMANDS.LIVE+i]
            if(that.command === COMMANDS.LIVE){
              that.current.stop()
              setTimeout(function(){
                if(that.command === COMMANDS.LIVE){
                  that.fadeout({
                    time: 3500,
                    player: startaction
                  })
                }
              }, 5000)
              startaction.volume(that.volume)
              startaction.play()
              that.current = startaction
            }
          }
        })
      }

      tracks[COMMANDS.WIN] = new Howl({
        src: [this.getFileName('wonround'+fileExt['wonround'])],
        loop: true,
        volume: this.volume
      })

      tracks[COMMANDS.LOSE] = new Howl({
        src: [this.getFileName('lostround'+fileExt['lostround'])],
        loop: true,
        volume: this.volume
      })

      tracks[COMMANDS.PLANTED+'10sec'] = new Howl({
        src: [this.getFileName('bombtenseccount'+fileExt['bombtenseccount'])],
        loop: true,
        volume: this.volume
      })

      tracks[COMMANDS.PLANTED] = new Howl({
        src: [this.getFileName('bombplanted'+fileExt['bombplanted'])],
        loop: true,
        volume: this.volume,
        onplay(){
          setTimeout(function(){
            if(that.command === 'planted'){
              that.current.stop()
              that.current = tracks[COMMANDS.PLANTED+'10sec']
              that.current.volume(that.volume)
              that.current.play()
            }
          }, 30000)
        }
      })

      for(track in tracks) {
        tracks[track].on('fade',onfade(tracks[track]))
      }

      if(playWhenDone){
        this.command = null
        this.play(playWhenDone)
      }
    }
  }

  setVolume(vol){
    this.volume = Number.parseFloat(vol)
    if(this.current){
      this.current.volume(this.volume)
    }
  }

  fadeout(ops={}){
    let time = ('time' in ops)?ops.time:2500
    let p = ('player' in ops)?ops.player:this.current
    if(p != null && (!('stopping' in p) || !p.stopping)){
      p.stopping = true
      p.fade(this.volume, 0, time)
    }
  }

  fadein(ops={}){
    let time = ('time' in ops)?ops.time:2500
    let p = ('player' in ops)?ops.player:this.current
    if(p != null){
      p.fade(0, this.volume, time)
      if(!p.playing()){
        p.play()
      }
    }
  }

  play(command){
    if(command !== this.command || !this.current || !this.current.playing()){
      if(command === COMMANDS.MENU){
        this.playMenu()
      }
      else if(command === COMMANDS.MVP){
        this.playMvp()
      }
      else if(command === COMMANDS.FREEZETIME){
        this.playFreezetime()
      }
      else if(command === COMMANDS.LIVE){
        if(this.command !== 'freezetime'){
          this.fadeout()
        }
        this.command = COMMANDS.LIVE
      }
      else if(command === COMMANDS.WIN || command === COMMANDS.LOSE){
        if(this.command !== COMMANDS.MVP){
          this.command = command
          this.playWinLose()
        }
      }
      else if(command === COMMANDS.PLANTED){
        this.playPlanted()
      }
      else{
        this.fadeout()
        this.command = null
        this.current = null
      }
    }
  }

  getFileName(name){
    return path.join(this.folder,name)
  }

  playMenu(){
    this.fadeout()
    this.command = COMMANDS.MENU
    this.current = this.tracks[COMMANDS.MENU]
    this.fadein()
  }

  playMvp(){
    this.command = COMMANDS.MVP
    this.fadeout({time:800})
    this.current = this.tracks[COMMANDS.MVP]
    this.fadein({time:800})
  }

  playFreezetime(num=0){
    let randnum = (num<=0)?Math.floor((Math.random() * 3) + 1):Math.min(3,num)
    this.fadeout()
    this.command = COMMANDS.FREEZETIME
    this.current = this.tracks[COMMANDS.FREEZETIME+randnum]
    this.fadein()
  }

  playWinLose(){
    let command = (this.command === COMMANDS.WIN)?COMMANDS.WIN:COMMANDS.LOSE
    this.fadeout()
    this.current = this.tracks[command]
    this.fadein()
  }

  playPlanted(){
    this.command = COMMANDS.PLANTED
    this.fadeout()
    this.current = this.tracks[COMMANDS.PLANTED]
    this.current.volume(this.volume)
    this.current.play()
  }
}

exports.player = KittenPlayer
