# Remote Control

Web-based desktop remote control. View and interact with a remote desktop from your browser using real-time screen capture and input forwarding.

## Features

- **Live screen streaming** — captures the host desktop as JPEG frames and streams them over WebSocket
- **Mouse control** — move, click, double-click, right-click, and scroll
- **Keyboard forwarding** — key presses including modifier combos (Ctrl+C, Alt+Tab, etc.)
- **Toggle input** — enable/disable input sending without disconnecting
- **Adjustable frame rate** — choose between 2, 3, or 5 fps
- **WhatsApp connection** — link a WhatsApp account by scanning a QR code from the browser

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

## WhatsApp connection

The toolbar has a **WhatsApp** button that opens a panel for linking a WhatsApp
account, powered by [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js).

1. Click **WhatsApp**, then **Connect** — the server starts a headless browser
   session and generates a QR code.
2. Scan the QR code from your phone: **WhatsApp → Settings → Linked devices →
   Link a device**.
3. Once linked, the status shows **Connected**. The session is saved on disk
   (`.wwebjs_auth/`), so it stays linked across server restarts until you click
   **Logout**.

Notes:

- `whatsapp-web.js` drives a real WhatsApp Web session through Puppeteer
  (Chromium), so the first `npm install` downloads a Chromium build.
- If the WhatsApp dependencies aren't installed, the rest of the app still runs;
  the server logs `WhatsApp: disabled` on startup.
- This is an unofficial library and not affiliated with WhatsApp. Use it in line
  with WhatsApp's Terms of Service.

## Security

This tool gives full desktop access to anyone who can reach the server. **Do not expose it on untrusted networks.** For remote access over the internet, use an SSH tunnel:

```bash
ssh -L 3000:localhost:3000 user@remote-host
```

## License

MIT
