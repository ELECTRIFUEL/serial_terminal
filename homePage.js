const { ipcRenderer } = require('electron');
var fs = require('fs')

var infoA =0
var infoB =0
var conState = null;
var preDataList = []
var listIndex = 0;
var newState = false
//const { dialog } = require('electron').remote
//var dataObj;
$(document).ready(function(){
 
  listPorts()
  updateWindowSize()
  conState = ipcRenderer.sendSync("connectPort", null)


  ipcRenderer.on("portList", (event, data) =>{
    //console.log(data)
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



  ipcRenderer.on("SAVE_FILE", (event, data) =>{
      saveOutput(data)
  })

  ipcRenderer.on("LOAD_FILE", (event, data) =>{
      loadOutput(data)
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
      updateWindowSize()
      //console.log(wheight)
  });


});




$(document).keydown( function( e ) { 
  if( e.target.nodeName == "INPUT" || e.target.nodeName == "TEXTAREA" ) {
   
   if(e.which==13){
     sendData();
   }else if(e.which==38){
     //upper key
     if(listIndex>0){
       listIndex--
       $("#sendtext").focus().val(preDataList[listIndex])
       
        //$("#sendtext").focus()
     }

     setTimeout(function(){
         var input = document.getElementById("sendtext");
            input.focus();
            input.setSelectionRange(input.value.length,input.value.length);
       },1);
   }else if(e.which==40){
     //lower key
     if(listIndex<preDataList.length-1){
       listIndex++
       $("#sendtext").val(preDataList[listIndex])
     }
   }
    
  }
  

//console.log("presse")
  
  // Do stuff 
});



function updateWindowSize(){
  var offsets = $('#dataArea').offset();
  var top = offsets.top;
  var left = offsets.left;
  var wheight = $(window).height();

  $('#dataArea').height(wheight-top);
}




function appendData(data){


  //var data1 = $("#serialData").html()
  var data1 = ""
  //console.log("start")
  for(var i=0;i<data.length;i++){
    if(data.charCodeAt(i)==10){
      data1 += "<br>";
      newState = true
    }else{
      if(newState){
        var d = new Date();
        var hr = d.getHours().toString().padStart(2,"0")
        var min = d.getMinutes().toString().padStart(2,"0")
        var sec = d.getSeconds().toString().padStart(2,"0")
        //console.log(d.getTime())
        var time =hr+":"+min+":"+sec+"."+d.getMilliseconds().toString().padStart(3,"0");
        data1 += time+"-> "
        //data1 += d.getTime().toString() +"=> "
        newState = false
      }
      data1 += data.charAt(i)
    }
  }
 
    var temp = $("#serialData").html()
    if(temp.length<10000){
    //if(true){
      $("#serialData").append(data1)
    }else{
      temp = temp + data1
      var len = temp.length
      temp = temp.slice(len-10000, len)
      $("#serialData").html(temp)
    }
  //$("#serialData").html(data1)
  var autoscroll = $("#autoscroll").prop("checked")
  //console.log(autoscroll)
  if(autoscroll){
    var objDiv = document.getElementById("dataArea");
    objDiv.scrollTop = objDiv.scrollHeight;
  }
}



function sendData(){
  var data = $("#sendtext").val()
  var end = $("#com_line_ending").val()
  listIndex = preDataList.length
  if(data.localeCompare(preDataList[listIndex-1])!=0){
    preDataList.push(data)
    listIndex++
  }
  
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


function saveOutput(filename){
  var data1 = $("#serialData").html()
  fs.writeFile(filename, data1, err=>{
    if(err){
      console.log("Error saving data")
      //dialog.showErrorBox("Error", "Unable to save data");
      //ipcRenderer.send('dataSave','false')
    }else{
      
    }
  })
}


function loadOutput(filename){
  console.log(filename)
  fs.readFile(filename, function(err, resdata) {
    if(err){
      console.log(err);
      //dialog.showErrorBox("Error", "Unable to load data");
      return;
    }
    try{
      //console.log(resdata)
      $("#serialData").html(resdata.toString())
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