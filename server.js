const HOST = '127.0.0.1'
const DEFAULT_PORT = '8793'
const AUTH = 'WooMeowWoo'
const http = require('http')

const COMMANDS = {
  'MENU':'menu',
  'MVP':'mvp',
  'FREEZETIME':'freezetime',
  'LIVE':'live',
  'WIN':'win',
  'LOSE':'lose',
  'PLANTED':'planted'
}

class KittenServer {

  /*
  ops{
    port - the port number of the server
    callback - the function to feed server data to
    start - whether or not the server should start right away
  }
  */
  constructor(ops) {
    this.port = ('port' in ops) ? ops['port'] : 8793
    this.server = null
    this.callback = ('callback' in ops) ? ops['callback'] : function({}){}
    this.steamid = null
    this.teamCT = false
    this.running = false
    this.mvps = 0
    if ('start' in ops && ops['start'] === true) {
      this.startServer()
    }
  }

  startServer() {
    if (this.running) {
      return
    }

    let that = this

    this.server = http.createServer(function(req, res) {
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
          let parsed = JSON.parse(body)
          if (parsed.hasOwnProperty('auth') && parsed.auth.hasOwnProperty('token') &&
            parsed.auth.token === AUTH) {
            delete parsed.auth
            this.getSteamID(parsed)
            this.updateRoundNum(parsed)
            this.updateTeam(parsed)
            console.log('\nPOST payload:')
            console.log(parsed)
            if (parsed.hasOwnProperty('round') && parsed.round.hasOwnProperty('phase')) {
              if (parsed.round.hasOwnProperty('bomb') && parsed.round.bomb === COMMANDS.PLANTED) {
                console.log('sending a '+COMMANDS.PLANTED)
                that.callback({type:'command', content:COMMANDS.PLANTED})
              } else if (parsed.round.phase === COMMANDS.FREEZETIME || parsed.round.phase === COMMANDS.LIVE) {
                console.log('sending a ' + parsed.round.phase)
                that.callback({type:'command', content:parsed.round.phase})
                if (parsed.player.hasOwnProperty('steamid') && parsed.player.steamid === this.steamid) {
                  if (parsed.player.hasOwnProperty('match_stats') && ~isNaN(parsed.player.match_stats.mvps)) {
                    that.mvps = parsed.player.match_stats.mvps
                  }
                }
              } else if (parsed.round.phase === 'over') {
                if (parsed.round.hasOwnProperty('win_team')) {
                  let teamname = (that.teamCT) ? 'CT' : 'T'
                  let comSend = COMMANDS.LOSE
                  if (parsed.round.win_team === teamname) {
                    comSend = COMMANDS.WIN
                    if (parsed.player.hasOwnProperty('steamid') && parsed.player.steamid === that.steamid) {
                      if (parsed.player.hasOwnProperty('match_stats') && !isNaN(parsed.player.match_stats.mvps)) {
                        if (parsed.player.match_stats.mvps > that.mvps) {
                          comSend = COMMANDS.MVP
                        }
                        that.mvps = parsed.player.match_stats.mvps
                      }
                    }
                  }
                  console.log('sending a ' + comSend)
                  that.callback({type:'command', content:comSend})
                }
              } else if (parsed.player.hasOwnProperty('steamid') && parsed.player.steamid === that.steamid) {
                if (parsed.player.hasOwnProperty('match_stats') && !isNaN(parsed.player.match_stats)) {
                  that.mvps = parsed.player.match_stats.mvps
                }
              }
            } else if (parsed.player.hasOwnProperty('activity') && parsed.player.activity === 'menu') {
              console.log('sending a menu')
              that.callback({type:'command', content:COMMANDS.MENU})
            }
          }
          res.end('')
        })
      } else {
        console.log('Not expecting other request types...')
        res.writeHead(200, {
          'Content-Type': 'text/html'
        })
        let html = '<html><body>Kitten HTTP Server at http://' + HOST + ':' + that.port + '</body></html>'
        res.end(html)
      }
    })

    this.server.listen(this.port, HOST)

    this.running = !this.running
  }

  stopServer() {
    if (!this.running) {
      return
    }

    let that = this

    this.server.close(function(err){
      that.running = !!err
    })
  }

  restartServer(){
    if (!this.running) {
      this.startServer()
    }

    let that = this

    this.server.close(function(err){
      if(!err){
        that.startServer()
      }
    })
  }

  changePort(port) {
    this.port = port
    this.restartServer()
  }

  changeCallback(callback) {
    this.callback = callback
    this.restartServer()
  }

  getSteamID(data) {
    if (data.hasOwnProperty('provider') && data.provider.hasOwnProperty('steamid')){
      this.steamid = data.provider.steamid
    }
  }

  updateRoundNum(data) {
    if (data.hasOwnProperty('map') && data.map.hasOwnProperty('round')) {
      this.callback({type:'roundNum', content:data.map.round})
    }
  }

  updateTeam(data) {
    if (data.player.hasOwnProperty('steamid') && data.player.steamid === this.steamid) {
      if (data.hasOwnProperty('player') && data.player.hasOwnProperty('team')) {
        this.teamCT = data.player.team === 'CT'
      }
    }
  }
}

exports.server = KittenServer
exports.commands = COMMANDS
