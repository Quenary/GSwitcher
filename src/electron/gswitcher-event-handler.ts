import { interval, Subscription } from 'rxjs';
import * as activeWin from 'active-win';
import { GSwitcherGDI32Wrapper } from './gswitcher-gdi32-wrapper';
import { GSwitcherStorage } from './gswitcher-storage';



/**
 * Event handler for gswitcher.
 * Handles changes of active window and applies display settings.
 */
export class GSwitcherEventHandler {

    private intervalSubsctiption: Subscription;
    private configChangeSubscription: Subscription;
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
        this.intervalSubsctiption?.unsubscribe();
        this.configChangeSubscription?.unsubscribe();
        this.intervalSubsctiption = interval(this.checkInterval)
            .subscribe(() => {
                activeWin().then(res => {
                    const path = res.owner.path;
                    const ownerFileName = res.owner.path.substring(
                        path.lastIndexOf('\\') + 1,
                        path.length
                    );
                    const config = this.gswitcherStorage.getConfig();
                    const displays = config?.displays;
                    if (this.activeOwnerFileName === ownerFileName ||
                        !config ||
                        !displays?.length) {
                        return;
                    }

                    this.activeOwnerFileName = ownerFileName;
                    const appConfig = config.applications[this.activeOwnerFileName];

                    const rampValues = !!appConfig
                        ? this.gswitcherGdi32Wrapper.calculateRampValues(
                            appConfig.brightness,
                            appConfig.contrast,
                            appConfig.gamma
                        )
                        : this.gswitcherGdi32Wrapper.calculateRampValues();
                    const ramp = this.gswitcherGdi32Wrapper.getFlatRamp(rampValues);
                    displays.forEach(display => {
                        this.gswitcherGdi32Wrapper.setDeviceGammaRamp(
                            display,
                            ramp
                        );
                    });
                })
            });
        // Reset last target on config update to apply possible changes
        this.configChangeSubscription = this.gswitcherStorage.observeConfig().subscribe(() => {
            this.activeOwnerFileName = null;
        });
    }

    public stop() {
        this.intervalSubsctiption?.unsubscribe();
        this.configChangeSubscription?.unsubscribe();
    }
}



