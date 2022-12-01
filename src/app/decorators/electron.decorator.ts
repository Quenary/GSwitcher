
/**
 * This decorator prevents methods execution
 * electron is missing in global object.
 * @param fallback optional fallback function.
 * @returns target return / fallback return.
 */
export function isElectron(fallback?: Function) {
    return function isElectron(target: any, propertyKey: string, descriptor: any) {
        const original = descriptor.value;
        descriptor.value = function (...args) {
            if (!window.electron) {
                console.warn(`property ${propertyKey} of ${this?.prototype?.name} decorated with @isElectron cannot be called because electron is missing in global object.`);
                return !!fallback
                    ? fallback(args)
                    : null;
            }
            return original.apply(this, args);
        }
        return descriptor;
    }
}