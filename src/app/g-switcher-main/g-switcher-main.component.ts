import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, debounceTime, forkJoin, from, map, Observable, of, skip, startWith, Subject, takeUntil, tap } from 'rxjs';
import { isElectron } from '../decorators/electron.decorator';
import type { IGSwitcherConfig, IGSwitcherConfigApplication } from 'src/electron/gswitcher-storage';
import { EInvokeEventName } from 'src/electron/electron-enums';
import * as lodashMerge from 'lodash.merge';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

const defaultAppConfig: IGSwitcherConfigApplication = {
  brightness: 0.5,
  contrast: 0.5,
  gamma: 1
};
const configMutateInterval: number = 100;
const configSaveInterval: number = 2000;

@Component({
  selector: 'app-g-switcher-main',
  templateUrl: './g-switcher-main.component.html',
  styleUrls: ['./g-switcher-main.component.scss']
})
export class GSwitcherMainComponent
  implements OnInit, OnDestroy {

  /**
   * Indicates delay before auto save config
   */
  public readonly saveProgressBarValue$ = new BehaviorSubject<number>(null);
  /**
   * List of connected displays
   */
  public displaysList: string[];
  /**
   * Current config
   */
  public readonly config$ = new BehaviorSubject<IGSwitcherConfig>(null);
  /**
   * 
   */
  public readonly applications$ = this.config$.pipe(map(res => !!res?.applications
    ? Object.keys(res.applications)
    : []));
  /**
   * Control of displays selection
   */
  public readonly displaysControl = new FormControl(null);
  /**
   * Main form
   */
  public readonly form: FormGroup = new FormGroup({
    appName: new FormControl(null, [Validators.required]),
    brightness: new FormControl(null, [Validators.required]),
    contrast: new FormControl(null, [Validators.required]),
    gamma: new FormControl(null, [Validators.required])
  });
  /**
   * Control of search input of process list
   */
  public readonly searchApplicationControl = new FormControl(null);
  /**
   * List of active processes
   */
  public readonly processesList$ = new BehaviorSubject<string[]>([]);
  /**
   * Filtered process list
   */
  public readonly filteredProcesses$ = combineLatest([
    this.searchApplicationControl.valueChanges.pipe(startWith(null)),
    this.processesList$.pipe(map(list => list ?? []))
  ])
    .pipe(
      map(([search, list]: [string, string[]]) => {
        if (!search) {
          return list;
        }
        const lowerValue = search.toLowerCase();
        return list.filter(item => item.toLocaleLowerCase().includes(lowerValue));
      })
    );
  /**
   * Auto launch enabled flag
   */
  public readonly autoLaunchControl = new FormControl(null);
  /**
   * Loading flag
   */
  public readonly isLoading$ = new BehaviorSubject<boolean>(false);
  /**
   * Loading processes list flag
   */
  public readonly isLoadingProcesses$ = new BehaviorSubject<boolean>(false);
  /**
   * Destroy observable to manage subscriptions
   */
  private readonly destroy$ = new Subject<void>();

  constructor(
    private matSnackBar: MatSnackBar,
    private translateService: TranslateService
  ) { }

  ngOnInit(): void {
    this.isLoading$.next(true);
    forkJoin([
      this.getDisplaysList(),
      this.getConfig(),
      this.getAutoLaunch()
    ]).subscribe(([displays, config, autoLaunch]) => {
      this.autoLaunchControl.setValue(autoLaunch);
      this.displaysList = displays;
      this.config$.next(config);
      this.searchApplicationControl.setValue(null);
      this.displaysControl.setValue(
        !!config?.displays?.length
          ? config.displays
          : []
      );
      this.initChangesManagement();
      this.isLoading$.next(false);
    });
  }

  /**
   * Init subscriptions on form / controls
   * values changes for processing and saving.
   */
  private initChangesManagement() {
    // Patching initial default values
    this.form.patchValue(defaultAppConfig);
    // Subscribe to changes of selected app
    this.form.controls.appName.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const appName = this.form.controls.appName.value;
        if (!appName) {
          this.form.patchValue(defaultAppConfig);
          return;
        };
        const config = this.config$.getValue();
        /**
         * Set default values in config for new application
         */
        if (!config?.applications?.[appName]) {
          const newConfig: Partial<IGSwitcherConfig> = {
            applications: {
              [appName]: { ...defaultAppConfig }
            }
          };
          this.config$.next(
            lodashMerge(
              config,
              newConfig
            )
          );
        }
        // Patching app config to form
        this.form.patchValue(this.config$.getValue().applications[appName]);
      });
    // Subscribe to main form changes
    this.form.valueChanges
      .pipe(
        debounceTime(configMutateInterval),
        takeUntil(this.destroy$)
      ).subscribe(() => {
        if (this.form.valid) {
          // Setting config of application
          const config = this.config$.getValue();
          const values = this.form.value;
          const appName = values.appName;
          const appConfig: IGSwitcherConfigApplication = {
            brightness: values.brightness,
            contrast: values.contrast,
            gamma: values.gamma
          };
          config.applications[appName] = appConfig;
          this.config$.next(config);
        }
      });
    // Subscribe to changes of selected displays
    this.displaysControl.valueChanges
      .pipe(
        debounceTime(configMutateInterval),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Modifying config
        this.config$.next({
          ...this.config$.getValue(),
          displays: this.displaysControl.value
        });
      });
    // save config subscription
    let interval: any;
    this.config$
      .pipe(
        skip(1),
        tap(() => {
          clearInterval(interval);
          this.saveProgressBarValue$.next(0);
          interval = setInterval(() => {
            if (this.saveProgressBarValue$.getValue() >= 100) {
              clearInterval(interval);
              this.saveProgressBarValue$.next(null);
              return;
            }
            this.saveProgressBarValue$.next(
              this.saveProgressBarValue$.getValue() + 10
            );
          }, configSaveInterval / 10);
        }),
        debounceTime(configSaveInterval),
        takeUntil(this.destroy$)
      )
      .subscribe(config => {
        this.setConfig(config);
        this.matSnackBar.open(
          this.translateService.instant('MAIN.SAVE_MESSAGE'),
          null,
          { duration: 1000 }
        );
      });
  }

  /**
   * Set application config
   * @param config 
   */
  @isElectron()
  private setConfig(config: IGSwitcherConfig) {
    window.electron.invoke(
      EInvokeEventName['gswitcher:set-config'],
      config
    );
  }

  /**
   * Get list of active processes
   */
  @isElectron(() => of([
    'code.exe', 'some.exe', 'other.exe', 'sys.exe', 'user.exe', 'blablablablabla.exe'
  ]))
  private getProcessList(): Observable<string[]> {
    return from(window.electron.invoke(EInvokeEventName['gswitcher:get-process-list']));
  }

  /**
   * Get list of connected displays
   */
  @isElectron(() => of(['DISPLAY_1', 'DISPLAY_2']))
  private getDisplaysList(): Observable<string[]> {
    return from(window.electron.invoke(EInvokeEventName['gswitcher:get-displays-list']));
  }

  /**
   * Get config from config file
   */
  @isElectron(() => of<IGSwitcherConfig>({ displays: [], applications: {} }))
  private getConfig(): Observable<IGSwitcherConfig> {
    return from(window.electron.invoke(EInvokeEventName['gswitcher:get-config']));
  }

  @isElectron(() => of(false))
  private getAutoLaunch(): Observable<boolean> {
    return from(window.electron.invoke(EInvokeEventName['gswitcher:get-auto-launch']));
  }

  @isElectron(() => of(null))
  private setAutoLaunch(flag: boolean) {
    return from(window.electron.invoke(EInvokeEventName['gswitcher:set-auto-launch'], flag));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Set appName from file
   * @param e input event
   */
  public setApplicationFromFile(e: any) {
    const fileName: string = e?.target?.files?.[0]?.name;
    this.changeValue(fileName, 'appName');
  }

  public setApplicationFromList(e: MatAutocompleteSelectedEvent) {
    this.searchApplicationControl.setValue(null);
    this.changeValue(e.option.value, 'appName');
  }

  /**
   * Change main form field value
   * @param value value
   * @param field field
   */
  public changeValue(value: any, field: string) {
    this.form.controls[field].setValue(value);
  }

  public removeApplication(appName: string) {
    const config = this.config$.getValue();
    delete config.applications[appName];
    this.config$.next(config);
    this.changeValue(null, 'appName');
  }

  public onClickProcessesInput() {
    this.processesList$.next(null);
    this.isLoadingProcesses$.next(true);
    from(this.getProcessList())
      .subscribe(res => {
        this.processesList$.next(res);
        this.isLoadingProcesses$.next(false);
      });
  }

  public onClosedAutocomplete() {
    this.processesList$.next(null);
    this.isLoadingProcesses$.next(false);
  }

  public onChangeAutoLaunch(e: MatSlideToggleChange) {
    this.setAutoLaunch(e.checked).subscribe({
      error: () => this.autoLaunchControl.setValue(!e.checked)
    });
  }
}
