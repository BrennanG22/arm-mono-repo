package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"

	"github.com/gorilla/websocket"
)

var (
	robotClients   = make(map[*websocket.Conn]bool)
	browserClients = make(map[*websocket.Conn]bool)
	mu             sync.Mutex
	upgrader       = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
)

func robotHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Robot upgrade error:", err)
		return
	}

	mu.Lock()
	robotClients[conn] = true
	mu.Unlock()

	defer func() {
		mu.Lock()
		delete(robotClients, conn)
		mu.Unlock()
		conn.Close()
	}()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}
		broadcast(msg, browserClients)
	}
}

func browserHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Browser upgrade error:", err)
		return
	}

	mu.Lock()
	browserClients[conn] = true
	mu.Unlock()

	defer func() {
		mu.Lock()
		delete(browserClients, conn)
		mu.Unlock()
		conn.Close()
	}()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}
		broadcast(msg, robotClients)
	}
}

func broadcast(msg []byte, targets map[*websocket.Conn]bool) {
	mu.Lock()
	defer mu.Unlock()
	for c := range targets {
		c.WriteMessage(websocket.TextMessage, msg)
	}
}

func spaHandler(distDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		path := filepath.Join(distDir, r.URL.Path)

		_, err := os.Stat(path)

		if os.IsNotExist(err) {
			http.ServeFile(w, r, filepath.Join(distDir, "index.html"))
			return
		}

		http.FileServer(http.Dir(distDir)).ServeHTTP(w, r)
	}
}

func main() {

	http.HandleFunc("/ws/robot", robotHandler)
	http.HandleFunc("/ws/browser", browserHandler)

	http.HandleFunc("/", spaHandler("./dist"))

	addr := "0.0.0.0:8080"
	log.Println("Listening on", addr)

	log.Fatal(http.ListenAndServe(addr, nil))
}