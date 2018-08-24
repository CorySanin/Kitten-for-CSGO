const fs = require('fs')
const v = require('./package').version
const rep = '[$'+'VERSION'+'$]'
const mainFiles = ['./app.js','./main.js']

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
