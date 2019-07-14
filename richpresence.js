/**
https://discordapp.com/developers/docs/rich-presence/how-to#updating-presence-update-presence-payload-fields
https://github.com/discordjs/RPC/blob/master/example/main.js
*/
const { shell } = require('electron')
const DiscordRPC = require('discord-rpc')
const clientId = '508480505583370272'

const rpc = new DiscordRPC.Client({ transport: 'ipc' })

let state = {}
let discordrptoggle = null

function setDiscordToggle(toggle){
  discordrptoggle = toggle
}

function updateInfo(data, appyToExisting){
  if(!appyToExisting){
    state = {}
  }
  for(let key in data){
    state[key] = data[key]
  }
}

function setActivity(){
  if(
      discordrptoggle !== null &&
      discordrptoggle.checked &&
      Object.keys(state).length !== 0
  ){
    rpc.setActivity(state)
  }
}

rpc.on('ready', () => {
  rpc.subscribe('GAME_JOIN', function(payload){
    shell.openExternal('steam://joinlobby/730/' + payload.secret)
  })

  setActivity()

  // activity can only be set every 15 seconds
  setInterval(() => {
    setActivity()
  }, 15e3)
})

rpc.login({ clientId }).catch(console.error)

exports.update = updateInfo
exports.setDiscordToggle = setDiscordToggle
