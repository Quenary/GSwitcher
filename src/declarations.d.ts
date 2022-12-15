import type { EInvokeEventName } from "./electron/electron-enums";

export { };

declare global {
    interface Window {
        electron: {
            versions: {
                node: () => string,
                chrome: () => string,
                electron: () => string
            },
            /**
             * Invoke main process event handlers
             * @param name Handler name
             * @param args Arguments
             * @returns any
             */
            invoke: <T = any>(name: EInvokeEventName, ...args: any[]) => Promise<T>
        }
    }
}