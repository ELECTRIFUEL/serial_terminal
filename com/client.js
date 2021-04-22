const url = require('url');
const net = require('net');


var socketClient = net.connect({host:'127.0.1.1', port:1234},  () => {
        // 'connect' listener
        console.log('connected to server!');
        //socketClient.write('world!\r\n');
        var data = {"type":0}
        socketClient.write(JSON.stringify(data))
      });

      socketClient.on('data', (data) => {
        console.log(data.toString());
        var data = JSON.parse(data);
        if(data.type==0){
          console.log(data)
          if(data.ports.length>0){
            var d = {"type":1, "dev":data.ports[0], "boud":9600}
            socketClient.write(JSON.stringify(d))
          }
        }else if(data.type==1){
			setTimeout(function(){
				var d = {"type":5, "close":25, "data":"AT\r"}
            socketClient.write(JSON.stringify(d))
			}, 2000);
        }else if(data.type==2){

        }else if(data.type==3){
        	
        }else if(data.type==4){
           console.log(data.data)
		   console.log(data.data.length)
        }
        

      });
      socketClient.on('end', () => {
        console.log('disconnected from server');
      });