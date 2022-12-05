import {
    app,
    BrowserWindow,
    ipcMain,
    IpcMainInvokeEvent,
    shell,
    Menu,
    MenuItemConstructorOptions,
    MenuItem
} from 'electron';
import * as url from 'url';
import * as path from 'path';
import { GSwitcherGDI32Wrapper } from './gswitcher-gdi32-wrapper';
import { graphics } from 'systeminformation'
import { GSwitcherStorage, IGSwitcherConfig } from './gswitcher-storage';
import { GSwitcherEventHandler } from './gswitcher-event-handler';
import { EInvokeEventName } from './electron-enums';
const { snapshot } = require('process-list');
const AutoLaunch = require('easy-auto-launch');

const autoLaunch = new AutoLaunch({
    name: app.getName(),
    path: app.getPath('exe')
});
const windowMenu: Array<MenuItemConstructorOptions | MenuItem> = [
    {
        label: 'File',
        submenu: [
            process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click: async () => {
                    await shell.openExternal('https://github.com/Quenary/GSwitcher')
                }
            }
        ]
    }
];
const menu = Menu.buildFromTemplate(windowMenu);
Menu.setApplicationMenu(menu);

let mainWindow: BrowserWindow | null;
const gswitcherStorage = new GSwitcherStorage();
const gswitcherGDI32Wrapper = new GSwitcherGDI32Wrapper();
const gswitcherEventHandler = new GSwitcherEventHandler(
    gswitcherGDI32Wrapper,
    gswitcherStorage,
    1000
);
gswitcherEventHandler.init();

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 960,
        height: 720,
        autoHideMenuBar: true,
        icon: path.join(__dirname, './assets/icon/favicon.ico'),
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
    ipcMain.handle(
        EInvokeEventName['gswitcher:get-displays-list'],
        async () => {
            const info = await graphics();
            return info.displays.map(item => item.deviceName)
        }
    );
    ipcMain.handle(
        EInvokeEventName['gswitcher:get-process-list'],
        async () => {
            const list: { name: string, owner: string }[] = await snapshot('name', 'owner');
            return [...new Set(
                list
                    .filter(item => item.name.includes('.exe') && !!item.owner)
                    .map(item => item.name)
            )];
        }
    );
    ipcMain.handle(
        EInvokeEventName['gswitcher:get-config'],
        () => gswitcherStorage.getConfig()
    );
    ipcMain.handle(
        EInvokeEventName['gswitcher:set-config'],
        (
            event: IpcMainInvokeEvent,
            config: IGSwitcherConfig
        ) => gswitcherStorage.setConfig(config)
    );
    ipcMain.handle(
        EInvokeEventName['gswitcher:get-auto-launch'],
        () => autoLaunch.isEnabled()
    );
    ipcMain.handle(
        EInvokeEventName['gswitcher:set-auto-launch'],
        (
            event: IpcMainInvokeEvent,
            flag: boolean
        ) => !!flag
                ? autoLaunch.enable()
                : autoLaunch.disable()
    );
}

app.on('ready', createWindow);
app.on('window-all-closed', function () {
    gswitcherEventHandler.stop();
    const rampValues = gswitcherGDI32Wrapper.calculateRampValues();
    const ramp = gswitcherGDI32Wrapper.getFlatRamp(rampValues);
    gswitcherStorage.getConfig().displays.forEach(display => {
        gswitcherGDI32Wrapper.setDeviceGammaRamp(display, ramp)
    });
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

