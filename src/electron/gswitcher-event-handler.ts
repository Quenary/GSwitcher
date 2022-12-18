import { BehaviorSubject, combineLatest, filter, interval, Subscription, throttleTime } from 'rxjs';
import * as activeWin from 'active-win';
import { GSwitcherGDI32Wrapper } from './gswitcher-gdi32-wrapper';
import { GSwitcherStorage, IGSwitcherConfigApplication } from './gswitcher-storage';



/**
 * Event handler for gswitcher.
 * Handles changes of active window and applies display settings.
 */
export class GSwitcherEventHandler {

    private readonly livePreviewDefaultValues: IGSwitcherConfigApplication = {
        brightness: 0.5,
        contrast: 0.5,
        gamma: 1
    };
    private intervalSubsctiption: Subscription;
    private configChangeSubscription: Subscription;
    private livePreviewValuesSubsctiption: Subscription;
    private activeOwnerFileName: string = null;
    private readonly livePreviewActive$ = new BehaviorSubject<boolean>(false);
    private readonly livePreviewValues$ = new BehaviorSubject<IGSwitcherConfigApplication>(this.livePreviewDefaultValues);

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
        this.stop();
        this.intervalSubsctiption = interval(this.checkInterval)
            .pipe(filter(() => !this.livePreviewActive$.value))
            .subscribe(() => {
                activeWin().then(res => {
                    const path = res.owner.path;
                    const ownerFileName = res.owner.path.substring(
                        path.lastIndexOf('\\') + 1,
                        path.length
                    );
                    if (this.activeOwnerFileName === ownerFileName) {
                        return;
                    }
                    this.activeOwnerFileName = ownerFileName;
                    const config = this.gswitcherStorage.getConfig();
                    this.setValues(
                        config?.displays,
                        config?.applications?.[this.activeOwnerFileName]
                    );
                })
            });
        this.livePreviewValuesSubsctiption = combineLatest([
            this.livePreviewActive$,
            this.livePreviewValues$
        ])
            .pipe(
                throttleTime(100),
                filter(([active, values]) => active)
            )
            .subscribe(([active, values]) => {
                this.setValues(
                    this.gswitcherStorage.getConfig()?.displays,
                    values
                );
            });
        // Reset last target on config update to apply possible changes
        this.configChangeSubscription = this.gswitcherStorage.observeConfig().subscribe(() => {
            this.activeOwnerFileName = null;
        });
    }

    /**
     * Set displays settings
     * @param displays displays list
     * @param values values
     */
    private setValues(displays: string[], values: IGSwitcherConfigApplication) {
        const rampValues = !!values
            ? this.gswitcherGdi32Wrapper.calculateRampValues(
                values.brightness,
                values.contrast,
                values.gamma
            )
            : this.gswitcherGdi32Wrapper.calculateRampValues();
        const ramp = this.gswitcherGdi32Wrapper.getFlatRamp(rampValues);
        displays?.forEach(display => {
            this.gswitcherGdi32Wrapper.setDeviceGammaRamp(
                display,
                ramp
            );
        });
    }

    public stop() {
        this.intervalSubsctiption?.unsubscribe();
        this.configChangeSubscription?.unsubscribe();
        this.livePreviewValuesSubsctiption?.unsubscribe();
    }

    public setLivePreviewActive(value: boolean) {
        this.livePreviewActive$.next(value);
        this.activeOwnerFileName = null;
    }

    public setLivePreviewValues(values: IGSwitcherConfigApplication) {
        this.livePreviewValues$.next(values);
    }
}



