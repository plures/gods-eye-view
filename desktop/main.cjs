const { app, BrowserWindow, dialog } = require('electron');
const path = require('node:path');

let server;

async function startServer() {
  const { createServer } = await import('vite');
  const root = app.getAppPath();
  const userData = app.getPath('userData');
  process.chdir(userData);
  process.env.GEV_SOURCE_ROOT = userData;
  process.env.GEV_VITE_CACHE_DIR = path.join(userData, '.vite');
  process.env.HOST = '127.0.0.1';
  process.env.PORT = '5173';

  server = await createServer({
    root,
    configLoader: 'runner',
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
    },
  });
  try {
    await server.listen();
    return server.resolvedUrls.local[0];
  } catch (error) {
    await server.close();
    server = undefined;
    throw error;
  }
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
  while (true) {
    try {
      openWindow(await startServer());
      break;
    } catch (error) {
      if (error.message === 'Port 5173 is already in use') {
        const { response } = await dialog.showMessageBox({
          type: 'warning',
          buttons: ['Retry', 'Quit'],
          defaultId: 0,
          cancelId: 1,
          title: "God's Eye View",
          message: 'Port 5173 is already in use.',
          detail: 'Close the application using port 5173, then choose Retry.',
        });
        if (response === 0) continue;
      } else {
        dialog.showErrorBox("God's Eye View", `Unable to start the local service.\n\n${error.message}`);
      }
      app.quit();
      break;
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async () => {
  await server?.close();
});
