const { app, BrowserWindow, Menu } = require('electron')
const { ipcMain } = require('electron');
const { dialog } = require('electron');
const modal = require('electron-modal');
const path = require('path');
const { remote } = require('electron');

const { exec, spawn } = require('child_process');

var child = require('child_process').execFile
const serialport = require('serialport') 
//app = remote.require('app');

const url = require('url');
const net = require('net');
const os = require('os');

//const { BrowserWindow1 } = require('electron').remote;
//var counter = 0;

// state:0 means not connected, state:1 means error connecting, state:2 means connected
var portConfig = {"port":"", "boud":9600, "state":0}
var portObj = null





function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1050,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.on('close', function(e){
    //console.log("closing")
        var choice = dialog.showMessageBoxSync(this,
            {
              type: 'question',
              buttons: ['Yes', 'No'],
              title: 'Confirm',
              message: 'Are you sure you want to quit?'
           });
           if(choice == 1){
             e.preventDefault();
             //console.log("cancelled")
           }else{
             
           }
   
  });
 

  
  var menu = Menu.buildFromTemplate([
      {
          label: 'File',
          submenu: [
              {
                label:'Open',
                click(){
                  openFile()
                }
              },
              {
                label:'Save',
                click(){
                  console.log("call")
                  saveFile(false)
                }
              },
              {
                label:'Save As',
                click(){
                  saveFile(true)
                }
              },
              {type:'separator'},
              {
                label:'Exit',
                click(){
                  app.quit()
                }
              }
          ]
      },
      {
        label: 'Settings',
        submenu: [
          {
            label:'Info',
            click(){
              showInfoModal(1)
            }
          },
          {
            label:'Help',
            click(){

            }
          }
        ]
      }
  ])
  //Menu.setApplicationMenu(menu); 

  // and load the index.html of the app.
  win.loadFile('main.html')
  //win.removeMenu()
  // Open the DevTools.
  win.webContents.openDevTools()

  
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(()=>{
  modal.setup();

  createWindow();
  
  console.log(os.platform())
  if(os.platform()=="win32"){
    //startSerialSocket(); 
  }else if(os.platform()=="linux"){
    //startSerialSocket(); 
  }
})

//app.allowRendererProcessReuse=false


/**
 * ASYNCHRONOUS
 */ 
ipcMain.on("refSerialPorts", (event, data) => {
  listPorts()
  event.returnValue = null; // callback with a response for an asynchronous request
});


ipcMain.on("connectPort", (event, data) => {
  if(data!=null){
    portConfig.port = data.port
    portConfig.boud = data.boud
    try{
      portObj= new serialport(data.port, { baudRate: data.boud, autoOpen: false });
      portObj.open(function (err) {
        if (err) {
          portconfig.state=1
        }else{
          portConfig.state=2

          portObj.on('data', function (data) {
            console.log('Data:', data)
          })
        }
        win.webContents.send('connState', portConfig);
      })
    }catch(e){
      console.log(e)
    }  
  }
  event.returnValue = portConfig; // callback with a response for an asynchronous request
});




/**
 * Function to get list of connected serial devices and IPC event
 */
function listPorts(){
  serialport.list().then((ports, err) => {
    if(err) {
      //document.getElementById('error').textContent = err.message
      return
    }
    //console.log('ports', ports);

    win.webContents.send('portList', ports);
  })
}








function  showInfoModal(data){
  console.log("calld")
  if(data==1){
     infoModal = new BrowserWindow({
        //parent: remote.getCurrentWindow(), 
        modal: true, 
        width:800, height:280,frame:false,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true
        }
    });
    infoModal.loadFile("infoModal.html")
    infoModal.removeMenu()
  }
}






function openFile(){
  dialog.showOpenDialog( {
    properties: ['openFile']
  }).then(result => {
    if(result.canceled==false){
      console.log(result.filePaths)
      win.setTitle(result.filePaths[0])
      win.webContents.send('LOAD_FILE', result.filePaths[0]);
    }
  }).catch(err =>{
    console.log(err);
    dialog.showErrorBox("Error", "Unable to load data");
  })
}


function saveFile(flag){
  if(flag || dataObj.filenameSave=="" ){
    let options = {
    //Placeholder 1
    title: "Save file - TimeProgram",

    //Placeholder 2
    defaultPath : "timeProgram",

    //Placeholder 4
    buttonLabel : "Save Time Program",

    //Placeholder 3
    filters :[
    {name: 'All Files', extensions: ['*']}
    ]
    }
    //var WIN = remote.getCurrentWindow();
    dialog.showSaveDialog(win,options).then(result =>{
      dataObj.filenameSave = result.filePath
      win.setTitle(result.filePath)
      win.webContents.send('SAVE_FILE', result.filePath);
    })
  }else{
    win.setTitle(dataObj.filenameSave)
    win.webContents.send('SAVE_FILE', dataObj.filenameSave);
  }
}




// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  //console.log("asdfasdf")
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})