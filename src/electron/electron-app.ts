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
    Notification,
    nativeTheme
} from 'electron';
import * as url from 'url';
import * as path from 'path';
import { GSwitcherGDI32Wrapper } from './gswitcher-gdi32-wrapper';
import { graphics } from 'systeminformation'
import { GSwitcherStorage, IGSwitcherConfig } from './gswitcher-storage';
import { GSwitcherEventHandler } from './gswitcher-event-handler';
import { EAppUrls, EInvokeEventName } from './electron-enums';
const { snapshot } = require('process-list');
const AutoLaunch = require('easy-auto-launch');
const versionCheck = require('github-version-checker');

const iconPath: string = path.join(__dirname, './assets/icon/favicon.ico');
const appName: string = 'GSwitcher';
const versionCheckOptions = {
    repo: 'GSwitcher',
    owner: 'Quenary',
    currentVersion: app.getVersion()
};

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
 * Variable that indicates wheather the app quiting
 * for manage background work notification.
 */
let appQuiting: boolean = false;
/**
 * Main window object.
 */
let mainWindow: BrowserWindow;
/**
 * Tray object reference to prevent garbage collection
 */
let tray: Tray = null;

/**
 * Checks for updates if it enabled in config
 */
function checkForUpdates() {
    if (gswitcherStorage.getConfig().checkUpdates) {
        versionCheck(versionCheckOptions, (err, res) => {
            const version = res?.tag?.name;
            if (!!version) {
                new Notification({
                    title: `New version ${res.tag.name} available!`,
                    icon: iconPath
                }).show();
            }
        });
    }
}

/**
 * Create main window
 */
function createWindow() {
    if (!!mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        return;
    }

    const isDarkMode: boolean = nativeTheme.shouldUseDarkColors;
    const darkColor: string = '#000000';
    const lightColor: string = '#FFFFFF';
    mainWindow = new BrowserWindow({
        width: 960,
        height: 720,
        autoHideMenuBar: true,
        icon: iconPath,
        title: `${appName} ${app.getVersion()}`,
        titleBarStyle: 'hidden',
        backgroundColor: isDarkMode ? darkColor : lightColor,
        titleBarOverlay: {
            color: isDarkMode ? darkColor : lightColor,
            symbolColor: isDarkMode ? lightColor : darkColor,
            height: 40
        },
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
        mainWindow = null;
        if (!appQuiting) {
            showBackgroundNotification();
        }
    });
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
    ipcMain.handle(
        EInvokeEventName['gswitcher:get-app-version'],
        () => app.getVersion()
    );
    ipcMain.handle(
        EInvokeEventName['gswitcher:check-version'],
        () => versionCheck(versionCheckOptions)
    );
    ipcMain.handle(
        EInvokeEventName['gswitcher:open-external-link'],
        (
            event: IpcMainInvokeEvent,
            link: string
        ) => shell.openExternal(link)
    );
    ipcMain.handle(
        EInvokeEventName['gswitcher:quit'],
        () => quitApp()
    );
}

/**
 * Run some code when app ready
 */
app.on('ready', () => {
    checkForUpdates();
    tray = createTrayIcon();
    prepareHandlers();
    if (gswitcherStorage.getConfig().launchMinimized) {
        showBackgroundNotification();
    }
    else {
        createWindow();
    }

});
/**
 * Run some code beffore app quit
 */
app.on('before-quit', () => {
    gswitcherEventHandler.stop();
    const rampValues = gswitcherGDI32Wrapper.calculateRampValues();
    const ramp = gswitcherGDI32Wrapper.getFlatRamp(rampValues);
    gswitcherStorage.getConfig().displays.forEach(display => {
        gswitcherGDI32Wrapper.setDeviceGammaRamp(display, ramp)
    });
});
/**
 * Prevent app from closing on all windows closed
 */
app.on('window-all-closed', event => {
    event.preventDefault();
})

/**
 * Quit the app
 */
function quitApp() {
    appQuiting = true;
    app.quit();
}
/**
 * Prepare app tray icon
 */
function createTrayIcon(): Tray {
    const trayMenuTemplate: Array<MenuItemConstructorOptions | MenuItem> = [
        {
            label: `${appName} ${app.getVersion()}`,
            enabled: false,
        },
        { type: 'separator' },
        {
            label: 'Show App',
            click: () => createWindow()
        },
        {
            label: 'Learn More',
            click: async () => {
                await shell.openExternal(EAppUrls.repo)
            }
        },
        {
            label: 'Quit',
            click: () => quitApp()
        }
    ];
    const trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
    const tray = new Tray(iconPath);
    tray.setContextMenu(trayMenu);
    tray.setToolTip('GSwitcher');
    tray.on('double-click', () => {
        createWindow();
    });
    return tray;
}
