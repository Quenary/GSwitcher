import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld(
    'electron',
    {
        versions: {
            node: () => process.versions.node,
            chrome: () => process.versions.chrome,
            electron: () => process.versions.electron
        },
        /**
         * Invoke main process event handlers
         * @param name Handler name
         * @param args Arguments
         * @returns any
         */
        invoke: (name: string, ...args: any[]) => ipcRenderer.invoke(name, ...args)
    }
);