const electron = require('electron')
const autoUpdater = require("electron-updater").autoUpdater
const ipc = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow // Module to create native browser window.
const path = require('path')
const url = require('url')
const os = require('os')


const menu = new electron.Menu()
menu.append(new electron.MenuItem({ label: 'Kitten [$VERSION$]',
    enabled: false}))
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
  width: 380, height: 560, resizable: false, maximizable: false, fullscreenable:false,
  icon:(os.platform() == 'win32')?'static\\icon\\icon.ico':'static/icon/icon_512.png'})

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
app.on('ready', function(){
  autoUpdater.checkForUpdatesAndNotify()
  createWindow()
})

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



ipc.on('dialog', function (event, message, title, response) {
  const options = {
    type: 'info',
    title,
    message: message,
    buttons: ['OK']
  }
  electron.dialog.showMessageBox(mainWindow, options, function (index) {
    event.sender.send(response, index)
  })
})

ipc.on('resize', function (event, args) {
  let dim = mainWindow.getSize()
  let width = ('width' in args)?args.width:dim[0]
  let height = ('height' in args)?args.height:dim[1]
  mainWindow.setSize(width, height, true)
})
