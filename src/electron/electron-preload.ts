import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld(
    'electron',
    {
        versions: {
            node: () => process.versions.node,
            chrome: () => process.versions.chrome,
            electron: () => process.versions.electron
        },
        invoke: (name: string, ...args: any[]) => ipcRenderer.invoke(name, ...args)
    }
);