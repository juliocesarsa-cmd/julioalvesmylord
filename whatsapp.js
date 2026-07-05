const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode");

// --- WhatsApp connection manager ---
//
// Wraps a single whatsapp-web.js client and broadcasts its connection state
// (QR code + status) to every connected Socket.IO client. Authentication is
// persisted on disk via LocalAuth, so a linked device stays linked across
// server restarts until the user logs out.

function setupWhatsApp(io) {
  let client = null;
  let state = { status: "disconnected", qr: null };

  function setState(status, qr = null) {
    state = { status, qr };
    io.emit("wa-state", state);
  }

  function start() {
    if (client) return;
    setState("initializing");

    client = new Client({
      authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    });

    client.on("qr", async (qr) => {
      try {
        const dataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 320 });
        setState("qr", dataUrl);
      } catch (err) {
        console.error("[wa] qr render:", err.message);
        setState("qr", null);
      }
    });

    client.on("authenticated", () => setState("authenticated"));

    client.on("ready", () => {
      console.log("[wa] client ready");
      setState("ready");
    });

    client.on("auth_failure", (msg) => {
      console.error("[wa] auth failure:", msg);
      setState("auth_failure");
    });

    client.on("disconnected", (reason) => {
      console.warn("[wa] disconnected:", reason);
      client = null;
      setState("disconnected");
    });

    client.initialize().catch((err) => {
      console.error("[wa] init error:", err.message);
      client = null;
      setState("error");
    });
  }

  async function logout() {
    if (!client) {
      setState("disconnected");
      return;
    }
    try {
      await client.logout();
    } catch (err) {
      console.error("[wa] logout:", err.message);
    }
    try {
      await client.destroy();
    } catch {}
    client = null;
    setState("disconnected");
  }

  io.on("connection", (socket) => {
    // Bring the freshly connected browser up to date with the current state.
    socket.emit("wa-state", state);

    socket.on("wa-connect", () => start());
    socket.on("wa-logout", () => logout());
  });
}

module.exports = { setupWhatsApp };
