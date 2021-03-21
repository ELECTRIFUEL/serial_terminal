const { ipcRenderer } = require('electron');
var fs = require('fs')

var infoA =0
var infoB =0
var conState = null;
//const { dialog } = require('electron').remote
//var dataObj;
$(document).ready(function(){
 
  listPorts()
  conState = ipcRenderer.sendSync("connectPort", null)


  ipcRenderer.on("portList", (event, data) =>{
    if(data!=null){
      showPorts(data)
    }
  })

  $("#connect").click(function() {
       conState = ipcRenderer.sendSync("connectPort", null)
       if(conState.state!=2){
         var selected = $('#com_port').find(":selected").text();
         var boud = parseInt($('#com_boud').val())
         conState = ipcRenderer.sendSync("connectPort", {"port":selected, "boud":boud})
       }else{
         ipcRenderer.sendSync("disconnectPort", null)
       }
       //console.log(conState)
  });

  ipcRenderer.on("connState", (event, data) =>{
    if(data!=null){
      conState= data;
      console.log(conState)
      updatePortStatus(conState.state)
    }
  })

  ipcRenderer.on("serialData", (event, data) =>{
    //console.log(data)
    appendData(data)
  })

  $("#sendData").click(function() {
      sendData()
  });

  $("#clearOutput").click(function() {
      $("#serialData").html("")
  });

  $(window).on('resize', function(){
      var offsets = $('#dataArea').offset();
      var top = offsets.top;
      var left = offsets.left;
      var wheight = $(window).height();

      $('#dataArea').height(wheight-top);
      //console.log(wheight)
  });


});




$(document).keydown( function( e ) { 
  if( e.target.nodeName == "INPUT" || e.target.nodeName == "TEXTAREA" ) {
   
   if(e.which==13){
     sendData();
   }
    
  }
  

//console.log("presse")
  
  // Do stuff 
});




function appendData(data){


  var data1 = $("#serialData").html()
  //console.log("start")
  for(var i=0;i<data.length;i++){
    if(data.charCodeAt(i)==10){
      data1 += "<br>";
    }else{
      data1 += data.charAt(i)
    }
  }
  $("#serialData").html(data1)
  var autoscroll = true;
  if(autoscroll){
    var objDiv = document.getElementById("dataArea");
    objDiv.scrollTop = objDiv.scrollHeight;
  }
}



function sendData(){
  var data = $("#sendtext").val()
  var end = $("#com_line_ending").val()
  //console.log(data)
  if(end==1){
   data += '\n';
  }else if(end==2){
   data += '\r';
  }else if(end==3){
   data += "\r\n"
  }
  //console.log(data)
  //appendData(data)
  ipcRenderer.sendSync("serialDataSend", data)
  $("#sendtext").val("")
}




function listPorts(){
  ipcRenderer.sendSync("refSerialPorts", null)
}


  



function showPorts(portList){
  //console.log("listport")
  var selectedA = $('#com_port').find(":selected").text();
  
  $("#com_port").empty().append('<option selected disabled value="null">Select</option>')
  for(var i=0;i<portList.length;i++){
    if(portList[i].manufacturer==null){
      continue
    }
    //console.log(portList[i].manufacturer)
    if(selectedA==portList[i].path){
      //console.log(pathA)
      $("#com_port").append('<option selected value="'+portList[i].path+'" >'+portList[i].path+'</option>');
    }else{
      $("#com_port").append('<option value="'+portList[i].path+'" >'+portList[i].path+'</option>');
    } 
  }
}


function updatePortStatus(state){
      if(state==0){
        $("#connect").removeClass("btn-warning")
        $("#connect").removeClass("btn-success")
        $("#connect").removeClass("btn-error")
        $("#connect").addClass("btn-primary")
        $("#connect").html("Connect")
      }else if(state==1){
        $("#connect").removeClass("btn-primary")
        $("#connect").removeClass("btn-success")
        $("#connect").removeClass("btn-warning")
        $("#connect").addClass("btn-error")
        $("#connect").html("Connecting")
      }else if(state==2){
        $("#connect").removeClass("btn-warning")
        $("#connect").removeClass("btn-primary")
        $("#connect").removeClass("btn-error")
        $("#connect").addClass("btn-success")
        $("#connect").html("Connected")
      }else{
        $("#connect").removeClass("btn-primary")
        $("#connect").removeClass("btn-success")
        $("#connect").removeClass("btn-error")
        $("#connect").addClass("btn-warning")
        $("#connect").html("Connecting") 
      } 
}



function loadSavedPorts(filename){
    fs.readFile(filename, function(err, resdata) {
      if(err){
        console.log(err);
        //dialog.showErrorBox("Error", "Unable to load data");
        return;
      }
      try{
        var tdata = JSON.parse(resdata)
        //console.log("loading ports")
        //console.log(tdata);
        if(tdata!=null){
          listPorts({}, true, tdata.portA, tdata.portB)
        }else{
          
        }
      }catch(e){
        console.log(e)
      }
      
    });
}



function saveSavedPorts(filename){
  var selectedA = $('#com_portA').find(":selected").text();
  var selectedB = $('#com_portB').find(":selected").text();
  data= {"portA":selectedA, "portB":selectedB}
  console.log(data)
    fs.writeFile(filename, JSON.stringify(data), err=>{
    if(err){
      console.log("Error saving data")
      //dialog.showErrorBox("Error", "Unable to save data");
      //ipcRenderer.send('dataSave','false')
    }else{
      
    }
  })
}