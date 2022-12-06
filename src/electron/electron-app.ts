import {
    app,
    BrowserWindow,
    ipcMain,
    IpcMainInvokeEvent,
    shell,
    Menu,
    MenuItemConstructorOptions,
    MenuItem,
    Tray,
    Notification
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

const iconPath: string = path.join(__dirname, './assets/icon/favicon.ico');
const appName: string = 'GSwitcher';

/**
 * Fix notification title 'electron.app.appname'
 * https://stackoverflow.com/questions/65859634/notification-from-electron-shows-electron-app-electron
 */
if (process.platform === 'win32') {
    app.setAppUserModelId(appName);
}

const gswitcherStorage = new GSwitcherStorage();
const gswitcherGDI32Wrapper = new GSwitcherGDI32Wrapper();
const gswitcherEventHandler = new GSwitcherEventHandler(
    gswitcherGDI32Wrapper,
    gswitcherStorage,
    1000
);
gswitcherEventHandler.init();
const autoLaunch = new AutoLaunch({
    name: app.getName(),
    path: app.getPath('exe')
});

/**
 * Quit flag. Becomes truthy on menu button 'quit' click.
 * 
 */
let mainWindowQuit: boolean = false;
let mainWindow: BrowserWindow | null;

function createWindow() {
    const launchMinimized = gswitcherStorage.getConfig().launchMinimized;
    mainWindow = new BrowserWindow({
        width: 960,
        height: 720,
        autoHideMenuBar: true,
        icon: iconPath,
        show: !launchMinimized,
        title: `${appName} ${app.getVersion()}`,
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
    mainWindow.on('closed', () => {
        mainWindow = null
    });
    mainWindow.on('close', event => {
        if (!mainWindowQuit) {
            // Prevent closing window on close button
            // minimize instead.
            event.preventDefault();
            mainWindow.hide();
        }
    });
    /**
     * Show notification on app minimize to tray
     */
    mainWindow.on('hide', () => {
        showBackgroundNotification();
    });
    prepareHandlers();
}

/**
 * Shows notification about app in background
 */
function showBackgroundNotification() {
    new Notification({
        title: `${appName} running in the background.`,
        icon: iconPath,
    }).show();
}

/**
 * Prepare handlers for renderer invoke events
 */
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

app.on('ready', () => {
    prepareMenus();
    createWindow();
});
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


/**
 * Tray object reference to prevent garbage collection
 */
let tray: Tray = null;
/**
 * Prepare app menu and tray menu
 */
function prepareMenus() {
    const quitButton: MenuItemConstructorOptions = {
        label: 'Quit',
        click: () => {
            mainWindowQuit = true;
            mainWindow?.close();
        }
    };
    const learnMoreButton: MenuItemConstructorOptions = {
        label: 'Learn More',
        click: async () => {
            await shell.openExternal('https://github.com/Quenary/GSwitcher')
        }
    };
    const windowMenuTemplate: Array<MenuItemConstructorOptions | MenuItem> = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Minimize',
                    click: () => mainWindow?.hide()
                },
                quitButton
            ]
        },
        {
            label: 'Help',
            submenu: [
                learnMoreButton
            ]
        }
    ];
    const windowMenu = Menu.buildFromTemplate(windowMenuTemplate);
    Menu.setApplicationMenu(windowMenu);
    const trayMenuTemplate: Array<MenuItemConstructorOptions | MenuItem> = [
        {
            label: `${appName} ${app.getVersion()}`,
            enabled: false,
        },
        { type: 'separator' },
        {
            label: 'Show App',
            click: () => mainWindow?.show()
        },
        learnMoreButton,
        quitButton
    ];
    const trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
    tray = new Tray(iconPath);
    tray.setContextMenu(trayMenu);
    tray.setToolTip('GSwitcher');
    tray.on('double-click', () => {
        mainWindow?.show();
    });
}
