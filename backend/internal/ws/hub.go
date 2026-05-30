package ws

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"

	"github.com/ferzferz11-sudo/pansion/internal/domain"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second
	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second
	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10
	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins in dev. In production, check against allow-list.
		return true
	},
}

// Client represents a single WebSocket connection.
type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	userID string
	role   string
	pensionID string
}

// Hub maintains the set of active clients and broadcasts messages.
// Thread-safe via Go channels (register/unregister) and per-client mutex.
type Hub struct {
	clients    map[*Client]bool
	broadcast  chan Message
	register   chan *Client
	unregister chan *Client
	logger     *slog.Logger
	mu         sync.RWMutex
}

// Message is a WebSocket envelope.
type Message struct {
	Type    string      `json:"type"`    // "sos", "room_update", "task_update"
	Payload interface{} `json:"payload"`
	// Target roles filter: empty = broadcast to all.
	TargetRoles []string `json:"-"`
}

// NewHub creates a new WebSocket hub.
func NewHub(logger *slog.Logger) *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan Message, 256),
		register:   make(chan *Client, 16),
		unregister: make(chan *Client, 16),
		logger:     logger,
	}
}

// Run starts the hub's main loop in a goroutine.
// It handles register/unregister and broadcasts in a single goroutine
// to avoid data races — classic Go channel-based concurrency pattern.
func (h *Hub) Run() {
	for {
		select {
		case c := <-h.register:
			h.mu.Lock()
			h.clients[c] = true
			h.mu.Unlock()
			h.logger.Info("ws client registered",
				"user_id", c.userID, "role", c.role, "total", len(h.clients))

		case c := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[c]; ok {
				delete(h.clients, c)
				close(c.send)
			}
			h.mu.Unlock()
			c.conn.Close()
			h.logger.Info("ws client disconnected",
				"user_id", c.userID, "total", len(h.clients))

		case m := <-h.broadcast:
			h.mu.RLock()
			for c := range h.clients {
				// Filter by role if TargetRoles is set.
				if len(m.TargetRoles) > 0 && !roleMatch(c.role, m.TargetRoles) {
					continue
				}
				select {
				case c.send <- mustJSON(m):
				default:
					// Client's send buffer is full — drop the client.
					h.logger.Warn("ws client buffer full, dropping",
						"user_id", c.userID)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastSos sends an SOS signal to all authorized roles.
func (h *Hub) BroadcastSos(signal domain.SosSignal) {
	h.broadcast <- Message{
		Type:        "sos",
		Payload:     signal,
		TargetRoles: []string{"manager", "doctor", "administrator"},
	}
}

// BroadcastRoomUpdate sends a room status update to all connected clients.
func (h *Hub) BroadcastRoomUpdate(room domain.Room) {
	h.broadcast <- Message{
		Type:    "room_update",
		Payload: room,
	}
}

// ServeWS upgrades HTTP to WebSocket and starts client goroutines.
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request, userID, role, pensionID string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		h.logger.Error("ws upgrade failed", "error", err)
		return
	}

	client := &Client{
		hub:       h,
		conn:      conn,
		send:      make(chan []byte, 64),
		userID:    userID,
		role:      role,
		pensionID: pensionID,
	}

	h.register <- client

	// Start read/write goroutines. Closing either signals unregister.
	go client.writePump()
	go client.readPump()
}

// readPump handles incoming messages and heartbeat (ping/pong).
// It closes when the client sends a ping/pong frame times out or the
// underlying connection drops (e.g. maid loses signal in basement).
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err,
				websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				c.hub.logger.Debug("ws unexpected close",
					"user_id", c.userID, "error", err)
			}
			return // exits readPump → triggers unregister via defer
		}
		// Currently we don't process incoming client messages
		// (one-way broadcast from server), but we keep the read loop
		// alive for heartbeat/ping-pong to detect dead connections.
	}
}

// writePump sends messages from the hub to the client.
// A ticker sends periodic pings to detect "dead" connections.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub closed the channel → send close frame.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// roleMatch checks if a client's role is in the target roles list.
func roleMatch(role string, targets []string) bool {
	for _, t := range targets {
		if role == t {
			return true
		}
	}
	return false
}

// mustJSON serializes a message to JSON. Panics on error (should never happen).
func mustJSON(v interface{}) []byte {
	data, err := json.Marshal(v)
	if err != nil {
		panic("ws mustJSON: " + err.Error())
	}
	return data
}
