const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    'electron',
    {
        versions: {
            node: () => process.versions.node,
            chrome: () => process.versions.chrome,
            electron: () => process.versions.electron
        },
        invoke: (name, ...args) => ipcRenderer.invoke(name, ...args)
    }
)

// function getText(text) {
//     return Buffer.from(`${text}\0`, "ucs2");
// }

// function createMessageBox() {
//     const lib = ffi.Library('user32', {
//         "MessageBoxW": [
//             "int32", ["int32", "string", "string", "int32"]
//         ],
//         "setCursorRos": [
//             "bool", ["int32", "int32"]
//         ]
//     });
//     const okOrCancel = lib.MessageBoxW(
//         0, this.getText('Hello from Node.js!'), this.getText('Hello, World!'), 1
//     );
// }