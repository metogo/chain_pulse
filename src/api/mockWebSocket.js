// Mock WebSocket Service for Pulse Engine v2.0

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.listeners = {
      open: [],
      message: [],
      close: [],
      error: []
    };
    this.intervalId = null;
    this.pingIntervalId = null;

    // Simulate connection delay
    setTimeout(() => {
      this.readyState = 1; // OPEN
      this.emit('open');
      this.startStream();
      this.startPingPong();
    }, 500);
  }

  addEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb({ data, type: event }));
    }
  }

  send(data) {
    // Mock send (e.g. pong)
    if (data === 'pong') {
      // console.log('MockWebSocket: Received pong');
    }
  }

  close() {
    this.readyState = 3; // CLOSED
    this.emit('close');
    this.stopStream();
    this.stopPingPong();
  }

  startStream() {
    // Simulate real-time updates every 1.5 seconds (Throttling per PRD)
    this.intervalId = setInterval(() => {
      const updates = this.generateMockUpdates();
      this.emit('message', JSON.stringify(updates));
    }, 1500);
  }

  stopStream() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startPingPong() {
    // Simulate server ping every 30s
    this.pingIntervalId = setInterval(() => {
      this.emit('message', 'ping');
    }, 30000);
  }

  stopPingPong() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
    }
  }

  generateMockUpdates() {
    // Generate random updates for top coins
    // Using v2.0 format: ID as "SYMBOL-USD"
    const coins = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOGE'];
    const updates = [];

    // Randomly select 2-5 coins to update
    const numUpdates = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < numUpdates; i++) {
      const symbol = coins[Math.floor(Math.random() * coins.length)];
      const changeDir = Math.random() > 0.5 ? 1 : -1;
      const changePercent = (Math.random() * 0.8) * changeDir; // Change 0-0.8%

      // We don't track absolute price in mock state, so we send relative change
      // In a real backend, this would be the absolute price.
      // To make it work with our frontend which expects absolute price updates or we calculate it,
      // we will send a "mock" absolute price if we can, but since we don't know the current price here easily without state,
      // we will stick to sending the *change percentage* and let the frontend apply it, 
      // OR we can simulate the v2.0 payload structure but keep the logic of "apply change".
      
      // v2.0 Payload: {"id":"BTC-USD", "p":89384.10, "ch24": -0.08, "mc": ...}
      // Since we don't have the base price here, we will send a special mock payload 
      // that tells the frontend to calculate the new price based on this change.
      // OR we can just send the change fields and let the frontend handle it.
      
      // Let's send a payload that looks like v2.0 but with a flag or just use the fields we need.
      // We'll send `p_change_pct` (custom for mock) to let frontend calculate `p`.
      // And `ch24_change` to update `ch24`.
      
      updates.push({
        id: `${symbol}-USD`,
        // p: 0, // Real backend would send absolute price
        p_change_pct: changePercent, // Mock helper
        ch24_change: changePercent, // Mock helper
        // mc: 0 // Market cap
      });
    }

    return updates;
  }
}

export default MockWebSocket;