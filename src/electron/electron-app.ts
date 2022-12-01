import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import * as url from 'url';
import * as path from 'path';
import { GSwitcherGDI32Wrapper } from './gswitcher-gdi32-wrapper';
import { graphics } from 'systeminformation'
import { GSwitcherStorage } from './gswitcher-storage';
import { GSwitcherEventHandler } from './gswitcher-event-handler';
const { snapshot } = require('process-list');

let mainWindow: BrowserWindow | null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 1000,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, './electron-preload.js')
        }
    });
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, `./index.html`),
            protocol: "file:",
            slashes: true
        })
    );
    mainWindow.webContents.openDevTools();
    mainWindow.on('closed', () => {
        mainWindow = null
    });
    prepareHandlers();
}

function prepareHandlers() {

    // const gdi32Wrapper = new GSwitcherGDI32Wrapper();
    // const storage = new GSwitcherStorage();
    const gswitcherStorage = new GSwitcherStorage();
    const gswitcherGDI32Wrapper = new GSwitcherGDI32Wrapper();
    const gswitcherEventHandler = new GSwitcherEventHandler(
        gswitcherGDI32Wrapper,
        gswitcherStorage,
        5000
    );
    ipcMain.handle(
        'gswitcher:set-displays',
        (
            event: IpcMainInvokeEvent,
            displays: string[]
        ) => {
            gswitcherStorage.setKeyValue('displays', displays);
        }
    )
    ipcMain.handle(
        'gswitcher:set-application-config',
        (
            event: IpcMainInvokeEvent,
            appName: string,
            brightness: number,
            contrast: number,
            gamma: number
        ) => {
            gswitcherStorage.setApplicationData(
                appName,
                {
                    brightness,
                    contrast,
                    gamma
                }
            );
        }
    )
    ipcMain.handle(
        'gswitcher:get-displays-list',
        async () => {
            const info = await graphics();
            return info.displays.map(item => item.deviceName)
        }
    );
    ipcMain.handle(
        'gswitcher:get-process-list',
        async () => {
            const list: { name: string, owner: string }[] = await snapshot('name', 'owner');
            return list
                .filter(item => item.name.includes('.exe') && !!item.owner)
                .map(item => item.name);
        }
    )
}

app.on('ready', createWindow);
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

