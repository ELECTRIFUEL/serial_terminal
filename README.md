# serial_terminal
Multiplateform serial terminal based on Electron. 



Build instructions :- https://www.electron.build/cli

	-Linux arm64
			electron-builder -l --arm64
	-Linux armv7l
			electron-builder -l --armv7l
	-Linux ia32_x86
			electron-builder -l --ia32
	-Linux x64
			electron-builder -l --x64

	-Win 32
			electron-builder -w --ia32
	-Win 64
			electron-builder -w --x64


Build insructios for go script :- 

env GOOS=windows GOARCH=amd64 go build package-import-path
env GOOS=windows GOARCH=386 go build package-import-path

env GOOS=linux GOARCH=amd64 go build package-import-path
env GOOS=linux GOARCH=386 go build package-import-path