const electron = require('electron')
const http = require('http')
const fs = require('fs')
const ipc = require('electron').ipcMain

const port = 8793
const host = '127.0.0.1'
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

let steamid = '76561198020996622'
let mvps = 0

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})

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
          console.log("POST payload: \n")
          console.log(parsed)
          if(parsed.player.hasOwnProperty('steamid') && parsed.player.steamid == steamid){
            console.log('steam id matched')
            if(parsed.player.hasOwnProperty('match_stats') && parsed.player.match_stats != NaN){
              if(parsed.player.match_stats.mvps > mvps){
                if(parsed.round.phase == 'over') {
                  console.log('sending an mvp')
                  mainWindow.send('command', 'mvp')
                }
                mvps = parsed.player.match_stats.mvps
              }
              else if(parsed.player.match_stats.mvps < mvps){
                console.log('node.js says that '+parsed.player.match_stats.mvps+'<'+mvps)
                mvps = 0
              }
            }
          }
        }
      	res.end( '' )
        mainWindow.send('message', parseInt(mvps))
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

server.listen(port, host)
console.log('Listening at http://' + host + ':' + port)
