import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APP_NAME,
  DEFAULT_AGENT_HOST,
  DEFAULT_AGENT_PORT,
  LEGAL_DISCLAIMER,
} from '@monillegence/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: APP_NAME,
    backgroundColor: '#0f1419',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const uiUrl = isDev
    ? 'http://127.0.0.1:5173'
    : `file://${path.join(__dirname, '../../ui/dist/index.html')}`;

  void mainWindow.loadURL(uiUrl);

  if (isDev && process.env.MONILLEGENCE_DEV_OPEN_DEVTOOLS !== 'false') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('monillegence:getAgentUrl', () => ({
  http: `http://${DEFAULT_AGENT_HOST}:${DEFAULT_AGENT_PORT}`,
  ws: `ws://${DEFAULT_AGENT_HOST}:${DEFAULT_AGENT_PORT}/agent`,
}));

ipcMain.handle('monillegence:getLegalDisclaimer', () => LEGAL_DISCLAIMER);

ipcMain.handle('monillegence:getVersion', () => app.getVersion());
