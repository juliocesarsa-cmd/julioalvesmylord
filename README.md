# Remote Control

Web-based desktop remote control. View and interact with a remote desktop from your browser using real-time screen capture and input forwarding.

## Features

- **Live screen streaming** — captures the host desktop as JPEG frames and streams them over WebSocket
- **Mouse control** — move, click, double-click, right-click, and scroll
- **Keyboard forwarding** — key presses including modifier combos (Ctrl+C, Alt+Tab, etc.)
- **Toggle input** — enable/disable input sending without disconnecting
- **Adjustable frame rate** — choose between 2, 3, or 5 fps

## Prerequisites

- Node.js 18+
- On Linux: additional system libraries for `robotjs` and `screenshot-desktop` (see below)

## Setup

```bash
npm install
npm start
```

Open `http://localhost:3000` in your browser and click **Connect**.

### Environment variables

| Variable           | Default | Description               |
|--------------------|---------|---------------------------|
| `PORT`             | `3000`  | HTTP server port          |
| `CAPTURE_INTERVAL` | `200`   | Screen capture interval (ms) |

### Linux dependencies

`screenshot-desktop` requires `scrot` or `imagemagick`, and `robotjs` needs build tools:

```bash
# Debian / Ubuntu
sudo apt install scrot build-essential libxtst-dev libpng-dev
```

## Architecture

```
Browser (client)          Server (host)
─────────────────         ──────────────
  index.html              server.js
  app.js  ◄──Socket.IO──► Express + Socket.IO
  canvas                   screenshot-desktop (capture)
                           robotjs (mouse / keyboard)
```

1. Client connects via Socket.IO and requests `start-stream`
2. Server captures screenshots at the configured interval and sends base64 JPEG frames
3. Client draws each frame to an HTML `<canvas>`
4. Mouse/keyboard events on the canvas are translated to remote coordinates and forwarded to the server
5. Server replays the input using `robotjs`

## Security

This tool gives full desktop access to anyone who can reach the server. **Do not expose it on untrusted networks.** For remote access over the internet, use an SSH tunnel:

```bash
ssh -L 3000:localhost:3000 user@remote-host
```

## License

MIT
