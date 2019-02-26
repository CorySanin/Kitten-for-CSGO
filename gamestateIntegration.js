const VDF = require('@node-steam/vdf')
const Registry = require('winreg')
const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const ipc = require('electron').ipcRenderer

const REG = 'SteamPath'
const WINSTEAMLIB = path.join('steamapps','libraryfolders.vdf')
const GSIFILENAME = 'gamestate_integration_kitten.cfg'
const HOMEDIR = os.homedir()

function saveConfig(config){
  let cfg = VDF.stringify({
    'Kitten State API Config':{
      'uri': config.url,
      'timeout': 5.0,
      'buffer': 0.1,
      'throttle': 0.1,
      'heartbeat': config.heartbeat,
      'auth': {
        'token': config.token
      },
      'data': {
        'provider': 1, 'map': 1, 'round': 1, 'player_id': 1, 'allplayers_id': 1,
        'player_state': 1, 'allplayers_state': 1, 'allplayers_match_stats': 1,
        'allplayers_weapons': 1, 'player_match_stats': 1, 'map_round_wins': 1,
        'phase_countdowns': 1
      }
    }
  })
  getCSGOPath(function(pth){
    fs.writeFile(path.join(pth, GSIFILENAME), cfg)
    if(os.platform() === 'win32'){
      ipc.send('csgoicon', path.resolve(pth, '..', '..', 'csgo.exe'))
    }
  })
}

function getCSGOPath(cb){
  getLibraryFoldersVDFPath(function(vdfPath){
    getLibraryFolders(vdfPath,function(libraries){
      libraries.push(path.join(path.dirname(vdfPath),'common'))
      libraries.forEach(function(pth,index){
        let cfgPath = path.join(pth, 'Counter-Strike Global Offensive', 'csgo', 'cfg')
        fs.pathExists(cfgPath , function(err, exists){
          if(!err && exists){
            cb(cfgPath)
          }
        })
      })
    })
  })
}

function getLibraryFoldersVDFPath(cb=function(){}){
  if(os.platform() === 'win32'){
    //look at HKEY_CURRENT_USER\Software\Valve\Steam
    let regKey = new Registry({
      hive: Registry.HKCU,  // open registry hive HKEY_CURRENT_USER
      key:  '\\Software\\Valve\\Steam'
    })
    regKey.values(function (err, items) {
      let r = false
      if (err){
        console.log('ERROR: '+err)
      }
      else{
        for (var i=0; i<items.length && !r; i++){
          if(items[i].name === REG){
            r = path.join(items[i].value,WINSTEAMLIB)
          }
        }
      }
      cb(r)
    })
  }
  else{
    let vdfpath
    if(os.platform() === 'darwin'){
      vdfpath = path.join(HOMEDIR,'Library/Application Support/Steam/steamapps/libraryfolders.vdf')
    }
    else{
      vdfpath = path.join(HOMEDIR,'.local/share/Steam/steamapps/libraryfolders.vdf')
    }
    cb(vdfpath)
    return vdfpath
  }
}

function getLibraryFolders(vdfPath,cb){
  let folders = []
  try{
    fs.readFile(vdfPath,{encoding:'utf8'},function(err,data){
      if(!err){
        let vdfdata = VDF.parse(data)
        if('LibraryFolders' in vdfdata){
          vdfdata = vdfdata['LibraryFolders']
          let key
          for(key in vdfdata){
            if(!isNaN(key)){
              folders.push(path.join(vdfdata[key],'steamapps','common'))
            }
          }
        }
      }
      cb(folders)
    })
  }
  catch(err){
    cb(folders)
  }
}

exports.saveConfig = saveConfig
