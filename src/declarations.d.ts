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
            invoke: <T = any>(name: EInvokeEventName, ...args: any[]) => Promise<T>
        }
    }
}