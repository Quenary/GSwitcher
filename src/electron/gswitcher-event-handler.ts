import { interval, Subject, takeUntil } from 'rxjs';
import * as activeWin from 'active-win';
import { GSwitcherGDI32Wrapper } from './gswitcher-gdi32-wrapper';
import { GSwitcherStorage } from './gswitcher-storage';



/**
 * Event handler for gswitcher.
 * Handles changes of active window and applies display settings.
 */
export class GSwitcherEventHandler {

    private readonly destroy$ = new Subject<void>();
    private activeOwnerFileName: string = null;

    /**
     * GSwitcherEventHandler
     * @param gswitcherGdi32Wrapper gdi32 wrapper class
     * @param gswitcherStorage Storage class
     * @param checkInterval check interval in milliseconds (default is 1000)
     */
    constructor(
        private gswitcherGdi32Wrapper: GSwitcherGDI32Wrapper,
        private gswitcherStorage: GSwitcherStorage,
        private checkInterval = 1000
    ) { }

    public init() {
        interval(this.checkInterval)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                activeWin().then(res => {
                    const path = res.owner.path;
                    const ownerFileName = res.owner.path.substring(
                        path.lastIndexOf('\\\\'),
                        path.length
                    );
                    if (this.activeOwnerFileName !== ownerFileName) {
                        this.activeOwnerFileName = ownerFileName;
                        const config = this.gswitcherStorage.getConfig();
                        const appConfig = config?.applications[this.activeOwnerFileName];
                        const displays = config?.displays;

                        if (!!appConfig && displays?.length) {
                            const rampValues = this.gswitcherGdi32Wrapper.calculateRampValues(
                                appConfig.brightness,
                                appConfig.contrast,
                                appConfig.gamma
                            );
                            const ramp = this.gswitcherGdi32Wrapper.getFlatRamp(rampValues);
                            displays.forEach(display => {
                                this.gswitcherGdi32Wrapper.setDeviceGammaRamp(
                                    display,
                                    ramp
                                );
                            });
                        }
                    }
                })
            });
    }

    public destroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}



