const os = require('os')
const dirSep = (os.platform() == 'win32')?'\\':'/'

class KittenPlayer{

  constructor(ops){
    this.players = []
    this.current = null
    this.command = null
    this.folder = ('folder' in ops)?ops.folder:''
    this.extension = ('extension' in ops)?ops.extension:''
    this.volume = ('volume' in ops)?ops.volume:1
  }

  fadeout(time=2500){
    if(this.current != null){
      this.current.fade(this.volume, 0, time)
    }
  }

  fadein(){
    if(this.current != null){
      this.current.fade(0, this.volume, 2500)
      if(!this.current.playing()){
        this.current.play()
      }
    }
  }

  play(command){
    if(command != this.command){
      if(command == 'menu'){
        this.playMenu()
      }
      else if(command == 'mvp'){
        this.playMvp()
      }
      else if(command == 'freezetime'){
        this.playFreezetime()
      }
      else if(command == 'live'){
        this.command = 'live'
      }
    }
  }

  getFileName(name){
    return this.folder+dirSep+name+'.'+this.extension
  }

  playMenu(){
    this.fadeout()
    this.command = 'menu'
    this.current = new Howl({
      src: [this.getFileName('mainmenu')],
      loop: true,
      volume: this.volume
    })
    this.fadein()
  }

  playMvp(){
    this.fadeout(800)
    this.command = 'mvp'
    this.current = new Howl({
      src: [this.getFileName('roundmvpanthem_01')],
      loop: true,
      volume: this.volume
    })
    this.current.play()
  }

  playFreezetime(){
    let randnum = Math.floor((Math.random() * 3) + 1)
    this.fadeout()
    this.command = 'freezetime'
    this.current = new Howl({
      src: [this.getFileName('startround_0'+randnum)],
      loop: true,
      volume: this.volume
    })
    this.current.play()
  }
}

exports.player = KittenPlayer
