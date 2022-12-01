import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, debounceTime, from, map, Observable, of, Subject, takeUntil, tap } from 'rxjs';
import { isElectron } from '../decorators/electron.decorator';
import type { IGSwitcherConfig, IGSwitcherConfigApplication } from 'src/electron/gswitcher-storage';
import { EInvokeEventName } from 'src/electron/electron-enums';
import * as lodashMerge from 'lodash.merge';

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
  public saveConfigIntervalProgress: number = null;
  /**
   * List of connected displays
   */
  public displaysList: string[];
  /**
   * List of active processes
   */
  public processList: string[];
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
  public displaysControl = new FormControl(null);
  /**
   * Main form
   */
  public form: FormGroup = new FormGroup({
    appName: new FormControl(null, [Validators.required]),
    brightness: new FormControl(null, [Validators.required]),
    contrast: new FormControl(null, [Validators.required]),
    gamma: new FormControl(null, [Validators.required])
  });
  /**
   * Destroy observable to manage subscriptions
   */
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
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
    this.getDisplaysList()?.subscribe(res => {
      this.displaysList = res;
    });
    this.getProcessList()?.subscribe(res => {
      this.processList = res;
    });
    this.getConfig()?.subscribe(res => {
      this.config$.next(res);
    });

    let interval: any;
    this.config$
      .pipe(
        tap(() => {
          clearInterval(interval);
          this.saveConfigIntervalProgress = 0;
          interval = setInterval(() => {
            if (this.saveConfigIntervalProgress >= 100) {
              clearInterval(interval);
              this.saveConfigIntervalProgress = null;
              return;
            }
            this.saveConfigIntervalProgress += 10;
            console.log(this.saveConfigIntervalProgress)
          }, configSaveInterval / 10);
        }),
        debounceTime(configSaveInterval),
        takeUntil(this.destroy$)
      )
      .subscribe(config => this.setConfig(config));
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
}
