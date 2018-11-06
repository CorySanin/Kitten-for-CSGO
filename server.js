const HOST = '127.0.0.1'
const DEFAULT_PORT = '8793'
const AUTH = 'WooMeowWoo'
const http = require('http')
const httpshutdown = require('http-shutdown')
const drp = require('./richpresence.js')
const richpresence = drp.update

const COMMANDS = {
  'MENU':'menu',
  'MVP':'mvp',
  'FREEZETIME':'freezetime',
  'LIVE':'live',
  'WIN':'win',
  'LOSE':'lose',
  'PLANTED':'planted'
}

const GAMEMODES = {
  'competitive': 'Competitive',
  'casual': 'Casual',
  'scrimcomp2v2': 'Wingman',
  'gungametrbomb': 'Demolition',
  'gungameprogressive': 'Arms Race',
  'deathmatch': 'Deathmatch'
}

const MAPS = {
  'ar_baggage': 'Baggage',
  'ar_dizzy': 'Dizzy',
  'ar_monastery': 'Monastery',
  'ar_shoots': 'Shoots',
  'cs_agency': 'Agency',
  'cs_assault': 'Assault',
  'cs_italy': 'Italy',
  'cs_office': 'Office',
  'de_austria': 'Austria',
  'de_bank': 'Bank',
  'de_biome': 'Biome',
  'de_cache': 'Cache',
  'de_canals': 'Canals',
  'de_cbble': 'Cobblestone',
  'de_dust2': 'Dust II',
  'de_inferno': 'Inferno',
  'de_lake': 'Lake',
  'de_mirage': 'Mirage',
  'de_nuke': 'Nuke',
  'de_overpass': 'Overpass',
  'de_safehouse': 'Safehouse',
  'de_shortdust': 'Shortdust',
  'de_shortnuke': 'Shortnuke',
  'de_stmarc': 'St. Marc',
  'de_subzero': 'Subzero',
  'de_sugarcane': 'Sugarcane',
  'de_train': 'Train',
  'gd_rialto': 'Rialto'
}

let server = false
let steamid = null
let port = DEFAULT_PORT
let callback = function(args){}
let teamCT = false
let mvps = -1
let running = false
let heartbeat = 30.0

function resolveName(name, nameobj){
  if(name in nameobj){
    return nameobj[name]
  }
  return name
}

function getSteamID(data){
  if (data.hasOwnProperty('provider') && data.provider.hasOwnProperty('steamid')){
    steamid = data.provider.steamid
  }
}

function updateRoundNum(data){
  if (data.hasOwnProperty('map') && data.map.hasOwnProperty('round')) {
    callback({type:'roundNum', content:data.map.round})
  }
}

function updateTeam(data){
  if (data.player.hasOwnProperty('steamid') && data.player.steamid === steamid) {
    if (data.hasOwnProperty('player') && data.player.hasOwnProperty('team')) {
      teamCT = data.player.team === 'CT'
    }
  }
}

function init(){
  server = http.createServer(function(req, res) {
    if (req.method === 'POST') {
      console.log('Handling POST request...')
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })

      let body = ''
      req.on('data', function(data) {
        body += data
      })
      req.on('end', function() {
        handleResponse(body)
        res.end('')
      })
    } else {
      console.log('Not expecting other request types...')
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      let html = '<html><body>Kitten HTTP Server at http://' + HOST + ':' + port + '</body></html>'
      res.end(html)
    }
  })
}

function handleResponse(body){
  let parsed = JSON.parse(body)
  if (parsed.hasOwnProperty('auth') &&
      parsed.auth.hasOwnProperty('token') &&
      parsed.auth.token === AUTH) {
    delete parsed.auth
    getSteamID(parsed)
    updateRoundNum(parsed)
    updateTeam(parsed)
    console.log('\nPOST payload:')
    console.log(parsed)
    if (parsed.hasOwnProperty('round') && parsed.round.hasOwnProperty('phase')) {
      if(parsed.hasOwnProperty('map')){
        try{
          let teamname = (teamCT)?'ct':'t'
          let scores = []
          if(teamCT){
            scores.push(parsed.map.team_ct.score)
          }
          scores.push(parsed.map.team_t.score)
          if(!teamCT){
            scores.push(parsed.map.team_ct.score)
          }

          richpresence({
            details: resolveName(parsed.map.mode, GAMEMODES) + ' ' + resolveName(parsed.map.name, MAPS),
            state: teamname.toUpperCase() + ' ' + scores.join('-'),
            largeImageKey: parsed.map.name,
            largeImageText: parsed.map.name,
            smallImageKey: teamname,
            smallImageText: teamname.toUpperCase() + ' Team'
          }, true)

          if(parsed.map.mode === 'gungameprogressive' || parsed.map.mode === 'deathmatch'){
            richpresence({
              state: teamname.toUpperCase() + ' ' + parsed.player.match_stats.kills + ' kills',
            }, true)
          }
        }
        catch(err) {
          console.log(err)
        }
      }


      if (parsed.round.hasOwnProperty('bomb') && parsed.round.bomb === COMMANDS.PLANTED) {
        console.log('sending a '+COMMANDS.PLANTED)
        callback({type:'command', content:COMMANDS.PLANTED})
      } else if (parsed.round.phase === COMMANDS.FREEZETIME || parsed.round.phase === COMMANDS.LIVE) {
        console.log('sending a ' + parsed.round.phase)
        callback({type:'command', content:parsed.round.phase})
        if (parsed.player.hasOwnProperty('steamid') && parsed.player.steamid === steamid) {
          if (parsed.player.hasOwnProperty('match_stats') && ~isNaN(parsed.player.match_stats.mvps)) {
            mvps = parsed.player.match_stats.mvps
          }
        }
      } else if (parsed.round.phase === 'over') {
        if (parsed.round.hasOwnProperty('win_team')) {
          let teamname = (teamCT) ? 'CT' : 'T'
          let comSend = COMMANDS.LOSE
          if (parsed.round.win_team === teamname) {
            comSend = COMMANDS.WIN
            if (parsed.player.hasOwnProperty('steamid') && parsed.player.steamid === steamid) {
              if (parsed.player.hasOwnProperty('match_stats') && !isNaN(parsed.player.match_stats.mvps)) {
                if (parsed.player.match_stats.mvps > mvps) {
                  comSend = COMMANDS.MVP
                }
                mvps = parsed.player.match_stats.mvps
              }
            }
          }
          console.log('sending a ' + comSend)
          callback({type:'command', content:comSend})
        }
      } else if (parsed.player.hasOwnProperty('steamid') && parsed.player.steamid === steamid) {
        if (parsed.player.hasOwnProperty('match_stats') && !isNaN(parsed.player.match_stats)) {
          mvps = parsed.player.match_stats.mvps
        }
      }
    } else if (parsed.player.hasOwnProperty('activity') && parsed.player.activity === 'menu') {
      console.log('sending a menu')
      callback({type:'command', content:COMMANDS.MENU})
      richpresence({
        state: 'Menu',
        largeImageKey: 'csgo',
        largeImageText: 'Counter-Strike: Global Offensive',
        smallImageKey: 'kitten',
        smallImageText: 'musickitten.net'
      }, false)
    }
  }
}

function startServer(){
  if(running){
    return
  }
  init()
  server = httpshutdown(server)
  server.listen(port)
  running = true
}

function stopServer(cb=function(err){}){
  if(server){
    server.shutdown(function(err){
      running = false
      cb(err)
    })
  }
  else{
    cb(false)
  }
}

function changeCallback(cb) {
  callback = cb
}

function changePort(p) {
  let newPort = p !== port
  port = p
  if(newPort){
    stopServer()
    startServer()
    /*For some reason, even with libraries like http-shutdown, the server.close
    callback NEVER gets fired. No idea why that happens.*/
  }
}

function restartServer(){
  throw 'server.close callback doesn\'t work. Can\'t perform a proper restart.'
}

function getHeartbeat(){
  return heartbeat
}

function getUrl(){
  return 'http://'+HOST+':'+port
}

function getAuth(){
  return AUTH
}

exports.start = startServer
exports.stop = stopServer
exports.restart = restartServer
exports.changeCallback = changeCallback
exports.changePort = changePort
exports.commands = COMMANDS
exports.getHeartbeat = getHeartbeat
exports.getUrl = getUrl
exports.getAuth = getAuth
exports.running = function(){
  return running
}
exports.richpresence = drp
