const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 10e6, // 10 MB for screen frames
});

const PORT = process.env.PORT || 3000;
const CAPTURE_INTERVAL_MS = parseInt(process.env.CAPTURE_INTERVAL || "200", 10);

// --- Optional native modules (graceful fallback) ---

let screenshot, robot;

try {
  screenshot = require("screenshot-desktop");
} catch {
  console.warn(
    "[warn] screenshot-desktop not available — screen capture disabled"
  );
}

try {
  robot = require("robotjs");
  robot.setMouseDelay(0);
  robot.setKeyboardDelay(0);
} catch {
  console.warn("[warn] robotjs not available — input forwarding disabled");
}

// --- WhatsApp connection (optional) ---

let whatsappEnabled = false;
try {
  const { setupWhatsApp } = require("./whatsapp");
  setupWhatsApp(io);
  whatsappEnabled = true;
} catch (err) {
  console.warn(
    "[warn] whatsapp-web.js not available — WhatsApp disabled:",
    err.message
  );
}

// --- Static files ---

app.use(express.static(path.join(__dirname, "public")));

// --- Screen info helper ---

function getScreenSize() {
  if (robot) {
    return robot.getScreenSize();
  }
  return { width: 1920, height: 1080 };
}

// --- Socket.IO ---

io.on("connection", (socket) => {
  console.log(`[+] Client connected: ${socket.id}`);

  const screenSize = getScreenSize();
  socket.emit("screen-size", screenSize);

  // --- Screen capture loop ---
  let captureTimer = null;

  function startCapture() {
    if (!screenshot) return;

    captureTimer = setInterval(async () => {
      try {
        const img = await screenshot({ format: "jpg" });
        socket.volatile.emit("screen-frame", img.toString("base64"));
      } catch (err) {
        console.error("[capture]", err.message);
      }
    }, CAPTURE_INTERVAL_MS);
  }

  function stopCapture() {
    if (captureTimer) {
      clearInterval(captureTimer);
      captureTimer = null;
    }
  }

  socket.on("start-stream", () => {
    stopCapture();
    startCapture();
  });

  socket.on("stop-stream", () => {
    stopCapture();
  });

  // --- Mouse events ---

  socket.on("mouse-move", ({ x, y }) => {
    if (!robot) return;
    robot.moveMouse(Math.round(x), Math.round(y));
  });

  socket.on("mouse-click", ({ x, y, button, double }) => {
    if (!robot) return;
    robot.moveMouse(Math.round(x), Math.round(y));
    const btn = button === 2 ? "right" : "left";
    robot.mouseClick(btn, double);
  });

  socket.on("mouse-scroll", ({ deltaX, deltaY }) => {
    if (!robot) return;
    robot.scrollMouse(Math.round(deltaX), Math.round(deltaY));
  });

  // --- Keyboard events ---

  socket.on("key-tap", ({ key, modifiers }) => {
    if (!robot) return;
    try {
      robot.keyTap(key, modifiers || []);
    } catch (err) {
      console.error("[key-tap]", err.message);
    }
  });

  socket.on("key-type", ({ text }) => {
    if (!robot) return;
    try {
      robot.typeString(text);
    } catch (err) {
      console.error("[key-type]", err.message);
    }
  });

  // --- Cleanup ---

  socket.on("disconnect", () => {
    console.log(`[-] Client disconnected: ${socket.id}`);
    stopCapture();
  });
});

// --- Start ---

server.listen(PORT, () => {
  console.log(`Remote Control server running on http://localhost:${PORT}`);
  console.log(`Screen size: ${JSON.stringify(getScreenSize())}`);
  console.log(
    `Capture: ${screenshot ? `every ${CAPTURE_INTERVAL_MS}ms` : "disabled"}`
  );
  console.log(`Input:   ${robot ? "enabled" : "disabled"}`);
  console.log(`WhatsApp: ${whatsappEnabled ? "enabled" : "disabled"}`);
});
