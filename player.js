/*global Howl, Howler */
const os = require('os')
const COMMANDS = require('./server.js').commands
const dirSep = (os.platform() === 'win32')?'\\':'/'

class KittenPlayer{

  constructor(ops={}){
    this.current = null
    this.command = null
    this.folder = ('folder' in ops)?ops.folder:''
    this.extension = ('extension' in ops)?ops.extension:''
    this.volume = ('volume' in ops)?ops.volume:1
  }

  fadeout(ops={}){
    let time = ('time' in ops)?ops.time:2500
    let p = ('player' in ops)?ops.player:this.current
    if(p != null){
      p.onfade = function(id){
        p.stop()
        if(p === this.current){
          this.current = null
          this.command = null
        }
      }
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
    if(command !== this.command){
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
        this.command = command
        this.playWinLose()
      }
      else if(command === COMMANDS.PLANTED){
        this.playPlanted()
      }
      else{
        this.fadeout()
      }
    }
  }

  getFileName(name){
    return this.folder+dirSep+name+'.'+this.extension
  }

  playMenu(){
    this.fadeout()
    this.command = COMMANDS.MENU
    this.current = new Howl({
      src: [this.getFileName('mainmenu')],
      loop: true,
      volume: this.volume
    })
    this.fadein()
  }

  playMvp(){
    this.command = COMMANDS.MVP
    this.fadeout({time:800})
    this.current = new Howl({
      src: [this.getFileName('roundmvpanthem_01')],
      loop: true, //not sure if it shoule loop or not ?
      volume: this.volume
    })
    this.fadein({time:800})
  }

  playFreezetime(){
    let that = this
    let randnum = Math.floor((Math.random() * 3) + 1)
    let startaction = new Howl({
      src: [this.getFileName('startaction_0'+randnum)],
      loop: false,
      volume: this.volume
    })
    this.fadeout()
    this.command = COMMANDS.FREEZETIME
    this.current = new Howl({
      src: [this.getFileName('startround_0'+randnum)],
      loop: true,
      volume: this.volume,
      onend(id){
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
          startaction.play()
          that.current = startaction
        }
      }
    })
    this.fadein()
  }

  playWinLose(){
    let filename = (this.command === COMMANDS.WIN)?'wonround':'lostround'
    this.fadeout()
    this.current = new Howl({
      src: [this.getFileName(filename)],
      loop: true,
      volume: this.volume
    })
    this.fadein()
  }

  playPlanted(){
    this.command = COMMANDS.PLANTED
    let that = this
    let tensecond = new Howl({
      src: [this.getFileName('bombtenseccount')],
      loop: true,
      volume: this.volume
    })
    this.fadeout()
    this.current = new Howl({
      src: [this.getFileName('bombplanted')],
      loop: true,
      volume: this.volume,
      onplay(){
        setTimeout(function(){
          if(that.command === 'planted'){
            that.fadeout()
            tensecond.play()
            that.current = tensecond
          }
        }, 30000)
      }
    })
    this.current.play()
  }
}

exports.player = KittenPlayer
