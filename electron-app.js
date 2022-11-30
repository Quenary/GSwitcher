const { app, BrowserWindow, ipcMain } = require('electron');
app.commandLine.appendSwitch('--no-sandbox', true);
const url = require("url");
const path = require("path");


let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 1000,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'electron-preload.js')
        }
    });
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, `/dist/gswitcher/index.html`),
            protocol: "file:",
            slashes: true
        })
    );
    mainWindow.webContents.openDevTools();
    mainWindow.on('closed', function () {
        mainWindow = null
    });
    prepareHandlers();
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


function prepareHandlers() {
    // const display = new DisplayMonitor();
    // const geolocator = new Geolocator();

    // ipcMain.handle(
    //     'gswitcher:getCoordinates',
    //     async () => {
    //         const promise = new Promise((resolve, reject) => {
    //             geolocator.getGeopositionAsync((error, result) => {
    //                 !!error
    //                     ? reject(error)
    //                     : resolve(result);
    //             });
    //         });
    //         try {
    //             const res = await promise;
    //             return {
    //                 lat: res.coordinate.latitude,
    //                 lon: res.coordinate.longitude
    //             }
    //         }
    //         catch {
    //             return {
    //                 error: 'Geolocation error'
    //             }
    //         }
    //     })
}