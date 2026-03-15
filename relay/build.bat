@echo off
setlocal

set GOOS=linux
set GOARCH=arm64
set CGO_ENABLED=0

go build -o relay relay.go

endlocal