/* ---- DOM refs ---- */

const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const infoEl = document.getElementById("info");
const btnConnect = document.getElementById("btn-connect");
const btnDisconnect = document.getElementById("btn-disconnect");
const chkInput = document.getElementById("chk-input");
const selQuality = document.getElementById("sel-quality");

/* ---- State ---- */

let socket = null;
let remoteScreen = { width: 1920, height: 1080 };
let frameCount = 0;
let fpsTimer = null;

/* ---- Helpers ---- */

function setStatus(text, connected) {
  statusEl.textContent = text;
  statusEl.className = connected ? "connected" : "";
}

function canvasToRemote(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = remoteScreen.width / rect.width;
  const scaleY = remoteScreen.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

/* ---- Key mapping (browser key → robotjs key) ---- */

const KEY_MAP = {
  Enter: "enter",
  Backspace: "backspace",
  Tab: "tab",
  Escape: "escape",
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Delete: "delete",
  Home: "home",
  End: "end",
  PageUp: "pageup",
  PageDown: "pagedown",
  CapsLock: "capslock",
  " ": "space",
  Control: "control",
  Shift: "shift",
  Alt: "alt",
  Meta: "command",
  F1: "f1",
  F2: "f2",
  F3: "f3",
  F4: "f4",
  F5: "f5",
  F6: "f6",
  F7: "f7",
  F8: "f8",
  F9: "f9",
  F10: "f10",
  F11: "f11",
  F12: "f12",
};

function mapKey(e) {
  if (KEY_MAP[e.key]) return KEY_MAP[e.key];
  if (e.key.length === 1) return e.key.toLowerCase();
  return null;
}

function getModifiers(e) {
  const mods = [];
  if (e.ctrlKey) mods.push("control");
  if (e.shiftKey) mods.push("shift");
  if (e.altKey) mods.push("alt");
  if (e.metaKey) mods.push("command");
  return mods;
}

/* ---- Connection ---- */

function connect() {
  if (socket) return;

  socket = io();
  setStatus("Connecting...", false);

  socket.on("connect", () => {
    setStatus("Connected", true);
    btnConnect.disabled = true;
    btnDisconnect.disabled = false;
    socket.emit("start-stream");

    frameCount = 0;
    fpsTimer = setInterval(() => {
      infoEl.textContent = `${frameCount} fps | ${remoteScreen.width}x${remoteScreen.height}`;
      frameCount = 0;
    }, 1000);
  });

  socket.on("screen-size", (size) => {
    remoteScreen = size;
    canvas.width = size.width;
    canvas.height = size.height;
  });

  socket.on("screen-frame", (base64) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      frameCount++;
    };
    img.src = "data:image/jpeg;base64," + base64;
  });

  socket.on("disconnect", () => {
    setStatus("Disconnected", false);
    cleanup();
  });
}

function disconnect() {
  if (!socket) return;
  socket.emit("stop-stream");
  socket.disconnect();
  cleanup();
}

function cleanup() {
  socket = null;
  btnConnect.disabled = false;
  btnDisconnect.disabled = true;
  if (fpsTimer) {
    clearInterval(fpsTimer);
    fpsTimer = null;
  }
  infoEl.textContent = "";
}

/* ---- Input events ---- */

function inputEnabled() {
  return socket && socket.connected && chkInput.checked;
}

canvas.addEventListener("mousemove", (e) => {
  if (!inputEnabled()) return;
  socket.volatile.emit("mouse-move", canvasToRemote(e.clientX, e.clientY));
});

canvas.addEventListener("mousedown", (e) => {
  if (!inputEnabled()) return;
  e.preventDefault();
  socket.emit("mouse-click", {
    ...canvasToRemote(e.clientX, e.clientY),
    button: e.button,
    double: false,
  });
});

canvas.addEventListener("dblclick", (e) => {
  if (!inputEnabled()) return;
  e.preventDefault();
  socket.emit("mouse-click", {
    ...canvasToRemote(e.clientX, e.clientY),
    button: e.button,
    double: true,
  });
});

canvas.addEventListener("wheel", (e) => {
  if (!inputEnabled()) return;
  e.preventDefault();
  socket.emit("mouse-scroll", {
    deltaX: Math.sign(e.deltaX) * 3,
    deltaY: Math.sign(e.deltaY) * 3,
  });
}, { passive: false });

canvas.addEventListener("contextmenu", (e) => e.preventDefault());

document.addEventListener("keydown", (e) => {
  if (!inputEnabled()) return;
  // Allow browser shortcuts when not focused on canvas
  if (document.activeElement !== canvas && document.activeElement !== document.body) return;

  const key = mapKey(e);
  if (!key) return;

  e.preventDefault();
  const modifiers = getModifiers(e).filter((m) => m !== KEY_MAP[e.key]);
  socket.emit("key-tap", { key, modifiers });
});

/* ---- Quality selector ---- */

selQuality.addEventListener("change", () => {
  if (!socket || !socket.connected) return;
  // Restart stream with new interval — server uses its default for now
  socket.emit("stop-stream");
  socket.emit("start-stream");
});

/* ---- Toolbar buttons ---- */

btnConnect.addEventListener("click", connect);
btnDisconnect.addEventListener("click", disconnect);

/* ---- Make canvas focusable for keyboard events ---- */

canvas.tabIndex = 0;
canvas.addEventListener("click", () => canvas.focus());

/* ---- WhatsApp ---- */

const btnWhatsApp = document.getElementById("btn-whatsapp");
const waPanel = document.getElementById("wa-panel");
const waClose = document.getElementById("wa-close");
const waStatusEl = document.getElementById("wa-status");
const waQr = document.getElementById("wa-qr");
const waHint = document.getElementById("wa-hint");
const waConnect = document.getElementById("wa-connect");
const waLogout = document.getElementById("wa-logout");

let waSocket = null;

const WA_LABELS = {
  disconnected: "Not connected",
  initializing: "Starting…",
  qr: "Scan the QR code with WhatsApp",
  authenticated: "Authenticated, loading…",
  ready: "Connected",
  auth_failure: "Authentication failed — try again",
  error: "Failed to start WhatsApp",
};

function waEnsureSocket() {
  if (waSocket) return;
  // Dedicated connection for WhatsApp events, independent of the
  // screen-streaming socket so it works whether or not you're streaming.
  waSocket = io();
  waSocket.on("wa-state", renderWaState);
}

function renderWaState({ status, qr }) {
  waStatusEl.textContent = WA_LABELS[status] || status;
  waStatusEl.className = status === "ready" ? "connected" : "";

  if (status === "qr" && qr) {
    waQr.src = qr;
    waQr.style.display = "block";
    waHint.textContent =
      "On your phone: WhatsApp → Settings → Linked devices → Link a device";
  } else {
    waQr.removeAttribute("src");
    waQr.style.display = "none";
    waHint.textContent =
      status === "ready" ? "Your device is linked." : "";
  }

  const busy =
    status === "ready" ||
    status === "initializing" ||
    status === "authenticated" ||
    status === "qr";
  waConnect.disabled = busy;
  waLogout.disabled = !(status === "ready" || status === "authenticated");
}

btnWhatsApp.addEventListener("click", () => {
  waEnsureSocket();
  waPanel.classList.remove("hidden");
});

waClose.addEventListener("click", () => waPanel.classList.add("hidden"));

waPanel.addEventListener("click", (e) => {
  if (e.target === waPanel) waPanel.classList.add("hidden");
});

waConnect.addEventListener("click", () => {
  waEnsureSocket();
  waSocket.emit("wa-connect");
});

waLogout.addEventListener("click", () => {
  if (waSocket) waSocket.emit("wa-logout");
});
