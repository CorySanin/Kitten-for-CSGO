const VDF = require('@node-steam/vdf')
const registry = require('winreg')
const fs = require('fs')
const path = require('path')
const os = require('os')

const REG = 'SteamPath'
const WINSTEAMLIB = path.join('steamapps','libraryfolders.vdf')

function saveConfig(config){

}

function getCSGOPath(){
  let lf = getLibraryFolders(getLibraryFoldersVDFPath())
}

function getLibraryFoldersVDFPath(cb=function(){}){
  if(os.platform() === 'win32'){
    //look at HKEY_CURRENT_USER\Software\Valve\Steam
    regKey = new registry({
      hive: registry.HKCU,  // open registry hive HKEY_CURRENT_USER
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

  }
}

function getLibraryFolders(vdf){

}



exports.saveConfig = saveConfig
