const { app, BrowserWindow, session, shell } = require("electron");
const path = require("node:path");

const PRODUCTION_URL = "https://discordia-g1.vercel.app";
const DEV_URL = "http://localhost:3000";

const APP_URL =
  process.env.DISCORDIA_URL || (app.isPackaged ? PRODUCTION_URL : DEV_URL);
const APP_ORIGIN = new URL(APP_URL).origin;

// El botón de Google abre su login en un popup que tiene que quedar dentro
// de la app para que la respuesta vuelva a la ventana principal.
const GOOGLE_ORIGIN = "https://accounts.google.com";

// Chromium lo dispara cuando una navegación pisa a otra, no por falta de red.
const ERR_ABORTED = -3;

// El micrófono (media) lo pide LiveKit al entrar a un canal de voz.
const ALLOWED_PERMISSIONS = new Set([
  "media",
  "notifications",
  "fullscreen",
  "clipboard-sanitized-write",
]);

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function openInBrowser(url) {
  const { protocol } = new URL(url);
  if (protocol === "https:" || protocol === "http:") {
    shell.openExternal(url);
  }
}

function setupPermissions() {
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback, details) => {
      callback(
        originOf(details.requestingUrl) === APP_ORIGIN &&
          ALLOWED_PERMISSIONS.has(permission),
      );
    },
  );

  session.defaultSession.setPermissionCheckHandler(
    (_webContents, permission, requestingOrigin) =>
      originOf(requestingOrigin) === APP_ORIGIN &&
      ALLOWED_PERMISSIONS.has(permission),
  );
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 940,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (originOf(url) === GOOGLE_ORIGIN) {
      return { action: "allow" };
    }
    openInBrowser(url);
    return { action: "deny" };
  });

  win.webContents.on(
    "did-fail-load",
    (_event, errorCode, _description, _url, isMainFrame) => {
      if (isMainFrame && errorCode !== ERR_ABORTED) {
        win.loadFile(path.join(__dirname, "offline.html"), {
          query: { url: APP_URL },
        });
      }
    },
  );

  win.loadURL(APP_URL);
  return win;
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let mainWindow = null;

  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    setupPermissions();
    mainWindow = createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
