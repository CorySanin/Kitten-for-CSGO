const electron = require('electron')
const http = require('http')
const fs = require('fs')
const ipc = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow // Module to create native browser window.
const path = require('path')
const url = require('url')
const os = require('os')

const host = '127.0.0.1'


const menu = new electron.Menu()
menu.append(new electron.MenuItem({ label: 'Launch CS:GO',
    click: function(){electron.shell.openExternal('steam://rungameid/730')}}))
menu.append(new electron.MenuItem({ label: 'Developer Tools',
    click: function(){mainWindow.webContents.openDevTools()}}))

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let port = 8793
let steamid = ''
let mvps = 0
let teamCT = false

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({backgroundColor: '#212121',
  width: 380, height: 555, resizable: false, maximizable: false, icon:
  (os.platform() == 'win32')?'static\\icon\\icon.ico':'static/icon/icon_512.png'})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  mainWindow.setMenu(null)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('browser-window-created', function (event, win) {
  win.webContents.on('context-menu', function (e, params) {
    menu.popup(win, params.x, params.y)
  })
})

ipc.on('show-context-menu', function (event) {
  const win = BrowserWindow.fromWebContents(event.sender)
  menu.popup(win)
})

let server = http.createServer( function(req, res) {

    if (req.method == 'POST') {
      console.log("Handling POST request...")
      res.writeHead(200, {'Content-Type': 'text/html'})

      let body = ''
      req.on('data', function (data) {
        body += data
      })
      req.on('end', function () {
        let parsed = JSON.parse(body)
        if(parsed.hasOwnProperty('auth') && parsed.auth.hasOwnProperty('token') &&
            parsed.auth.token == 'WooMeowWoo') {
          delete parsed.auth
          getSteamID(parsed)
          updateRoundNum(parsed)
          updateTeam(parsed)
          console.log("\nPOST payload:")
          console.log(parsed)
          if(parsed.hasOwnProperty('round') && parsed.round.hasOwnProperty('phase')){
            if(parsed.round.hasOwnProperty('bomb') && parsed.round.bomb == 'planted'){
              console.log('sending a planted')
              mainWindow.send('command', 'planted')
            }
            else if(parsed.round.phase == 'freezetime' || parsed.round.phase == 'live'){
              console.log('sending a '+parsed.round.phase)
              mainWindow.send('command', parsed.round.phase)
              if(parsed.player.hasOwnProperty('steamid') && parsed.player.steamid == steamid){
                if(parsed.player.hasOwnProperty('match_stats') && parsed.player.match_stats.mvps != NaN){
                  mvps = parsed.player.match_stats.mvps
                }
              }
            }
            else if(parsed.round.phase == 'over'){
              if(parsed.round.hasOwnProperty('win_team')){
                let teamname = (teamCT)? 'CT':'T'
                let comSend = 'lose'
                if(parsed.round.win_team == teamname){
                  comSend = 'win'
                  if(parsed.player.hasOwnProperty('steamid') && parsed.player.steamid == steamid){
                    if(parsed.player.hasOwnProperty('match_stats') && parsed.player.match_stats.mvps != NaN){
                      if(parsed.player.match_stats.mvps > mvps){
                        comSend = 'mvp'
                      }
                      mvps = parsed.player.match_stats.mvps
                    }
                  }
                }
                console.log('sending a '+comSend)
                mainWindow.send('command', comSend)
              }
            }
            else if(parsed.player.hasOwnProperty('steamid') && parsed.player.steamid == steamid){
              if(parsed.player.hasOwnProperty('match_stats') && parsed.player.match_stats != NaN){
                mvps = parsed.player.match_stats.mvps
              }
            }
          }
          else if(parsed.player.hasOwnProperty('activity') && parsed.player.activity == 'menu'){
            console.log('sending a menu')
            mainWindow.send('command', 'menu')
          }
        }
      	res.end( '' )
        //mainWindow.send('message', parseInt(mvps))
      })
    }
    else
    {
      console.log("Not expecting other request types...")
      res.writeHead(200, {'Content-Type': 'text/html'})
      let html = '<html><body>Kitten HTTP Server at http://' + host + ':' + port + '</body></html>'
      res.end(html)
    }
})

function getSteamID(data){
  if(data.hasOwnProperty('provider') && data.provider.hasOwnProperty('steamid'))
    steamid = data.provider.steamid
}

function updateRoundNum(data){
  if(data.hasOwnProperty('map') && data.map.hasOwnProperty('round'))
    mainWindow.send('roundNum', data.map.round)
}

function updateTeam(data){
  if(data.player.hasOwnProperty('steamid') && data.player.steamid == steamid){
    if(data.hasOwnProperty('player') && data.player.hasOwnProperty('team'))
      teamCT = data.player.team == 'CT'
  }
}

ipc.on('open-kitten-dir', function (event, callback){
  electron.dialog.showOpenDialog({
    properties: ['openDirectory']
  }, function (files) {
    if (files)
      event.sender.send(callback, files)
    else
      event.sender.send(callback, [])
  })
})



ipc.on('dialog', function (event, message) {
  const options = {
    type: 'info',
    title: 'Yo.',
    message: message,
    buttons: ['OK']
  }
  electron.dialog.showMessageBox(options, function (index) {
    event.sender.send('information-dialog-selection', index)
  })
})

ipc.on('start-server', function (event, prt) {
  server.listen(prt, host)
  console.log('Listening at http://' + host + ':' + prt)
  port = prt
})
