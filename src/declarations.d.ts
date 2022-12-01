export { };

declare global {
    interface Window {
        electron: {
            versions: {
                node: () => string,
                chrome: () => string,
                electron: () => string
            },
            invoke: <T = any>(name: string, ...args: any[]) => Promise<T>
        }
    }
}