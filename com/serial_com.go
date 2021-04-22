	package main

	import (
  "fmt"
  "flag"
  "go.bug.st/serial.v1"
  //"github.com/tarm/serial"
  "log"
  "strings"
  //"time"
  "net"
  "strconv"
  "os"
  "bufio"
  //"os"
  "encoding/json"
  //"reflect"
  "runtime"
  
)




func main(){

  port := flag.Int("port", 1234, "Port on which server to be started(Default 1234)")
  flag.Parse()

  t := strconv.Itoa(*port)
  ln, err0 := net.Listen("tcp", ":"+t)

  if err0 !=nil{
    os.Exit(1)
  }
  defer ln.Close()


  fmt.Println(runtime.GOMAXPROCS(0))
  //fmt.Println(runtime.GOMAXPROCS(4))

  for{
    // accept connection
    conn, err1 := ln.Accept()

    if err1 != nil{
      //os.Exit(1)
    }else{
      go handleConnection(conn)
    }

  }

  //time.Sleep(5 * time.Second)

  fmt.Println("Exit")

}




func handleConnection(conn net.Conn) {

    defer conn.Close()
    var (
      buf = make([]byte, 1024)
      r   = bufio.NewReader(conn)
      //w   = bufio.NewWriter(conn)
    )

    flag := false
    //fmt.Println(reflect.TypeOf(serial.Open))

    var serialPort serial.Port
    for{
      n, err := r.Read(buf)
      //data := string(buf[:n])
      if err!=nil{
        fmt.Println("Client Dis..")
        break;
      }else{
        //fmt.Println(data)
        var f map[string]interface{}
        err := json.Unmarshal(buf[:n], &f)
        if err!=nil{
          fmt.Println(err)
        }else{
          //fmt.Println(f["type"])
          fmt.Printf("var1 = %T\n", f["type"]) 
          i := int(f["type"].(float64))
          switch i{
          case 0:
            //port list
            ports, err := serial.GetPortsList()
            if err != nil {
              log.Fatal(err)
            }else{
              ports = removeDuplicates(ports)
              //fmt.Println(len(ports))
              fmt.Println(ports)
              type response2 struct {
                  Type   int      `json:"type"`
                  Ports []string `json:"ports"`
              }

              res2D := &response2{
                Type:   0,
                Ports: ports}
              res2B, err3 := json.Marshal(res2D)
              if err3!=nil{
                fmt.Println(err3);
              }else{
                //fmt.Println(res2B)
                 conn.Write(res2B)
              }
            }
 
          case 1:
              //connect serial
              //fmt.Println("connect serial")
              boud := int(f["boud"].(float64))
              dev := string(f["dev"].(string))
              mode := &serial.Mode{
                BaudRate: boud,
                Parity:   serial.NoParity,
                DataBits: 8,
                StopBits: serial.OneStopBit,
              }

              type res struct {
                  Type   int      `json:"type"`
                  State int   `json:"state"`
              }

              var err1 error
              serialPort, err1 = serial.Open(dev, mode)
              if err1 != nil {
                serialPort = nil
                flag = false
                res2D := &res{
                Type:   1,
                State: 0}
                resJson, err3 := json.Marshal(res2D)
                if err3==nil{
                  conn.Write(resJson)
                }
              }else{
                go handleSerialData(serialPort, conn)
                flag = true
                //fmt.Println("connected", serialPort)
                res2D := &res{
                Type:   1,
                State: 1}
                resJson, err3 := json.Marshal(res2D)
                if err3==nil{
                  conn.Write(resJson)
                }
              }
          
          case 2:
            if flag ==true{
              if serialPort==nil{
                flag = false
              }else{
                flag = false
                _ = serialPort.Close()
              }
            }

          case 3:
            type res struct {
                Type   int      `json:"type"`
                State int   `json:"state"`
            }
            data := string(f["data"].(string))
            if flag==false || serialPort==nil{
              
            }else{
              _, errW := serialPort.Write([]byte(data))
              if errW != nil{
                fmt.Println("Error writing")
                res2D := &res{
                Type:   3,
                State: 0}
                resJson, err3 := json.Marshal(res2D)
                if err3==nil{
                  conn.Write(resJson)
                }
              }else{
                res2D := &res{
                Type:   3,
                State: 1}
                resJson, err3 := json.Marshal(res2D)
                if err3==nil{
                  conn.Write(resJson)
                }
              }
            }
		  case 5:
			if int(f["close"].(float64))==25{
			//fmt.Println("exit");
				os.Exit(1)
				
			}

          }
        }
      }

      //time.Sleep(100 * time.Millisecond)
    }
    //fmt.Println(serialPort)
    if flag == true{
      error := serialPort.Close()
      fmt.Println("closing")
      fmt.Println(error)
    }
    
}



func handleSerialData(port serial.Port, conn net.Conn){
  var buff = []byte{}
  len := 0
  for {
    b := make([]byte, 150)
    n, err := port.Read(b)
    if err != nil {
      fmt.Println(err)
      break
    }
    if n == 0 {
      //fmt.Println("\nEOF")
      break
    }

    type res struct {
        Type   int      `json:"type"`
        Data string   `json:"data"`
    }
    res2D := &res{
    Type:   4,
    Data: string(b[:n])}
    resJson, err3 := json.Marshal(res2D)
    if err3==nil{
      conn.Write(resJson)
    }
    continue


    buff = append(buff, b[:n]...)
    //fmt.Println(string(b))
    len = len + n

    for{
      index := strings.Index(string(buff[:len]), "*")
      if index>=0{
         //fmt.Println(string(buff))
        //index = strings.Index(string(buff[:len]), "*")
        //break
        //fmt.Println("Bulk Data")
        //fmt.Println(buff[:len])
        type res struct {
            Type   int      `json:"type"`
            Data string   `json:"data"`
        }
        res2D := &res{
        Type:   4,
        Data: string(buff[:index+1])}
        resJson, err3 := json.Marshal(res2D)
        if err3==nil{
          conn.Write(resJson)
        }
        //fmt.Println(len)
        //fmt.Println(index)
        if index<len{
          //fmt.Println("diff")
          //fmt.Println(buff[index+1:len])
          buff = buff[index+1:len]
          len = len - index -1
        }else{
          buff = []byte{}
          len = 0
          
        }
        
      }else{
        break;
      }
    }
    //time.Sleep(100 * time.Millisecond)
  }

}


func removeDuplicates(data []string) []string{
  keys := make(map[string]bool)
  list := []string{}

    for _, entry := range data { 
        if _, value := keys[entry]; !value { 
            keys[entry] = true
            list = append(list, entry) 
        } 
    } 
    return list 
}