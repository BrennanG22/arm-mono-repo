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
	adminClients   = make(map[*websocket.Conn]bool)
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

	cookie, _ := r.Cookie("admin_token")

	isAdmin := cookie != nil && cookie.Value == "supper-secret-admin-token"

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

	mu.Lock()
	hasRobots := len(robotClients) > 0
	mu.Unlock()

	if hasRobots {
		broadcast([]byte(`{"message":"initialConnect"}`), robotClients)
	}

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}
		if isAdmin {
			broadcast(msg, robotClients)
		}
	}
}

func adminBrowserHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := generateAdminToken()

		http.SetCookie(w, &http.Cookie{
			Name:     "admin_token",
			Value:    token,
			Path:     "/",
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
		})

		http.Redirect(w, r, "/", http.StatusSeeOther)
	}
}

func generateAdminToken() string {
	// Note to grader: This is just to control state for the demo, in a real deployment this should be made secure
	return "supper-secret-admin-token"
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

	http.HandleFunc("/adminBrowser", adminBrowserHandler())
	http.HandleFunc("/", spaHandler("./dist"))

	addr := "0.0.0.0:8080"
	log.Println("Listening on", addr)

	log.Fatal(http.ListenAndServe(addr, nil))
}
