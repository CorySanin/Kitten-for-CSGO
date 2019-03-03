const fs = require('fs')
const path = require('path')
const v = require('./package').version
const rep = /\[\$VERSION\$\]/gi
const mainFiles = ['./app.js','./main.js']

function copyLocale(source, dest){
  fs.mkdirSync(path.join(__dirname, 'locales', dest))
  fs.copyFileSync(
    path.join(__dirname, 'locales', source, 'translation.json'),
    path.join(__dirname, 'locales', dest, 'translation.json')
  )
}

let i
for(i in mainFiles){
  try{
    let data = fs.readFileSync(mainFiles[i], 'utf8').replace(rep, v)
    fs.writeFileSync(mainFiles[i], data)
  }
  catch(err){
    console.log(err)
  }
}
let data = fs.readFileSync('./package.json', 'utf8').replace(/--publish=never/g, '--publish=always')
fs.writeFileSync('./package.json', data)

copyLocale('en-US', 'en')
