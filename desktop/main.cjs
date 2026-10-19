const { app, BrowserWindow, dialog } = require('electron');
const path = require('node:path');

let server;

async function startServer() {
  const { createServer } = await import('vite');
  const root = app.getAppPath();
  process.chdir(app.getPath('userData'));
  process.env.HOST = '127.0.0.1';
  process.env.PORT = '0';

  server = await createServer({
    root,
    server: {
      host: '127.0.0.1',
      port: 0,
      strictPort: true,
    },
  });
  await server.listen();
  return server.resolvedUrls.local[0];
}

function openWindow(url) {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  window.loadURL(url);
}

app.whenReady().then(async () => {
  try {
    openWindow(await startServer());
  } catch (error) {
    dialog.showErrorBox("God's Eye View", `Unable to start the local service.\n\n${error.message}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async () => {
  await server?.close();
});
