const { app, BrowserWindow, Menu } = require('electron')
const { ipcMain } = require('electron');
const { dialog } = require('electron');
const modal = require('electron-modal');
const path = require('path');
const { remote } = require('electron');

const { exec, spawn } = require('child_process');

var child = require('child_process').execFile
//const serialport = require('serialport') 
//app = remote.require('app');

const url = require('url');
const net = require('net');
const os = require('os');

//const { BrowserWindow1 } = require('electron').remote;
//var counter = 0;

// state:0 means not connected, state:1 means error connecting, state:2 means connected
var portConfig = {"port":"", "boud":9600, "state":0}
var portAObj = null
var dataObj = {"filenameSave":"output.txt"}

var socketClient = null;
var serialPort = 30129;
var serialHost = '127.0.1.1'

var child_process = null;





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
				try{
				   var data = {"type":5, "close":25}
					socketClient.write(JSON.stringify(data))
				}catch(e){
				}
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
                  //console.log("call")
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
      /*{
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
      }*/
  ])
  Menu.setApplicationMenu(menu); 

  // and load the index.html of the app.
  win.loadFile('main.html')
  //win.removeMenu()
  // Open the DevTools.
  //win.webContents.openDevTools()
}







function startSerialSocket(){
  socketClient = net.connect({host:serialHost, port:serialPort},  () => {
    // 'connect' listener
    console.log('connected to server!');
    //socketClient.write('world!\r\n');
    var data = {"type":0}
    socketClient.write(JSON.stringify(data))


    socketClient.on('data', (data) =>{
      try{
      var res = JSON.parse(data);
      }catch(e){
        console.log(e);
        console.log(data);
        return;
      }
      if(res.type==0){
        console.log(res.ports)
        portList = []
        res.ports.forEach(function(port){
          portList.push({'path':port, 'manufacturer':0})
          //console.log("Port: ", port);
        })
        win.webContents.send('portList', portList);
      }
    });

    socketClient.on('end', () =>{
      console.log("Dis")
      socketClient = null;
    })

  });
}


function between(min, max) {  
  return Math.floor(
    Math.random() * (max - min) + min
  )
}



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(()=>{
  modal.setup();

  createWindow();
  
  console.log("loaded")
  var tableData = [];
  var filenameLoad = "";
  var filenameSave = "";
  var timeProgState = 0;
  var nomralState = false;
  var pumpA = 50;

  serialPort = between(3000, 60000)
  //serialPort = 1234;
  console.log(serialPort)
  console.log(os.platform())
  if(os.platform()=="win32"){
    //startSerialSocket();
    console.log(__dirname)
      child_process=exec(__dirname+'/../extraResources/serial_com.exe -port '+serialPort, (err, stdout, stderr) => {
        if (err) {
          console.log("error in child process")
          console.error(err);
          return;
        }
        console.log("child process started")
        //startSerialSocket()
        console.log(stdout);
      });
  }else if(os.platform()=="linux"){
    //startSerialSocket();
    var dir = __dirname.toString()
    console.log(__dirname)
    dir  = dir.replace("app.asar", "")
    console.log(dir)
    child_process = exec(dir+'/extraResources/serial_com -port '+serialPort, (err, stdout, stderr) => {
        if (err) {
          console.log("error in child process")
          console.error(err);
          return;
        }
        console.log("child process started")
        //startSerialSocket()
        console.log(stdout);
      });
  }

  setTimeout(function(){
    startSerialSocket()
  }, 1500)
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
    connectPort(data.port, data.boud)
  }
  event.returnValue = portConfig; // callback with a response for an asynchronous request
});


ipcMain.on("serialDataSend", (event, data) => {
  var state = true;
  if(portConfig.state==2){
    try{
        var d = {"type":3, "data":data}
        portAobj.write(JSON.stringify(d))
    }catch(e){
      console.log(e)
    }
  }else{
    var state = false;
  }
  event.returnValue = state; // callback with a response for an asynchronous request
});



ipcMain.on("disconnectPort", (event, data) => {
  if(portConfig.state==2){
    disconnectPort()
  }
  portConfig.state=0;
  event.returnValue = true;
});




/**
 * Function to get list of connected serial devices and IPC event
 */
function listPorts(){
  if(socketClient!=null){
      try{
        var data = {"type":0}
        socketClient.write(JSON.stringify(data))
      }catch(e){
        console.log(e)
      }
    }
}



function connectPort(path, boud){

      try{
        portAobj.end()
      }catch{

      }
    portAobj = net.connect({host:serialHost, port:serialPort},  () => {
      // 'connect' listener
      console.log('connected to serverA!');
      portConfig.state = 1;
       win.webContents.send('connState', portConfig);
      var data = {"type":1, "dev":path, "boud":boud}
      //socketClient.write('world!\r\n');
      portAobj.write(JSON.stringify(data))

      portAobj.on("data", (data) =>{
        //console.log(data.toString())
        data = data.toString()
        var array = data.split("}{")
        //console.log(array)
        var len = array.length
        for(var i=0;i<len;i++){
          var d = array[i]
          if(len>1){
            if(i==0){
             d = array[i]+"}"
            }else if(i<(len-1)){
               d = "{" + array[i] + "}"
            }else{
              d = "{" + array[i]
            }
          }
          //console.log(d)
          try{
            var res = JSON.parse(d);
          }catch(e){
            console.log(e)
            return;
          }

          if(res.type==4){
            win.webContents.send('serialData', res.data.toString());
           
          }else if(res.type==1){
            if(res.state==1){
              //console.log("connectedA")
              portConfig.state = 2;
              win.webContents.send('connState', portConfig);
              
            }else{
              //console.log("disconnectedA")
              portConfig.state = 0
              win.webContents.send('connState', portConfig);
            }   
          }
        }
      });
      portAobj.on("end", () =>{
        //console.log("portAclose")
        portConfig.state = 0
        win.webContents.send('connState', portConfig);
      })
    })
    return 1;
}

function disconnectPort(){
    if(portAobj!=null){
      console.log("aclose")
      try{
        portAobj.end();
        portAobj = null;
      }catch(e){
        try{
          portAobj.end();
          portAobj = null;
        }catch(e){
          console.log(e)
        }
      }
    }
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
  dialog.showOpenDialog({
    properties: ['openFile']
  }).then(result => {
    if(result.canceled==false){
      //console.log(result.filePaths)
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
    title: "Save file - Output",

    //Placeholder 2
    defaultPath : "output.txt",

    //Placeholder 4
    buttonLabel : "Save Output",

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
    win.setTitle("Serial Terminal- "+dataObj.filenameSave)
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