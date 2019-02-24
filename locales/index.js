const app = require('electron').app
const i18next = require('i18next')
const fs = require('fs-extra')
const path = require('path')
const langPath = __dirname
const fallbackLng = 'en-US'
const i18nextSyncFileSystemBackend = require('i18next-sync-fs-backend')

let langfiles = fs.readdirSync(langPath)
let lngs = langfiles.filter(function(filename){
  return fs.lstatSync(path.join(__dirname, filename)).isDirectory()
})

exports.translate = function(locale){
  if(!lngs.includes(locale)){
    locale = locale.split('-')[0]
    if(!lngs.includes(locale)){
      locale = fallbackLng
    }
  }

  i18next.use(i18nextSyncFileSystemBackend)
  .init({
    lng:locale,
    fallbackLng,
    lngs,
    backend: {
		    loadPath: path.join(langPath,'{{lng}}','translation.json'),
    },
    initImmediate: false
  })
  return function(key){
    return i18next.t(key)
  }
}
