import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  forkJoin,
  from,
  map,
  skip,
  startWith,
  Subject,
  takeUntil,
  tap
} from 'rxjs';
import type { IGSwitcherConfig, IGSwitcherConfigApplication } from 'src/electron/gswitcher-storage';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ElectronService } from '../shared/electron.service';

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
   * Version of application
   */
  public readonly appVersion$ = this.electronService.getAppVersion();
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
    appName: new FormControl(null, [Validators.required, Validators.pattern(/.exe$/)]),
    brightness: new FormControl(null, [Validators.required, Validators.min(0), Validators.max(1)]),
    contrast: new FormControl(null, [Validators.required, Validators.min(0), Validators.max(1)]),
    gamma: new FormControl(null, [Validators.required, Validators.min(0.4), Validators.max(2.8)])
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
  public readonly launchMinimizedControl = new FormControl(null);
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
    private translateService: TranslateService,
    private electronService: ElectronService
  ) { }

  ngOnInit(): void {
    this.isLoading$.next(true);
    forkJoin([
      this.electronService.getDisplaysList(),
      this.electronService.getConfig(),
      this.electronService.getAutoLaunch()
    ]).subscribe(([displays, config, autoLaunch]) => {
      this.autoLaunchControl.setValue(autoLaunch);
      this.launchMinimizedControl.setValue(config.launchMinimized)
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
        this.electronService.setConfig(config);
        this.showSaveSnack();
      });
  }

  /**
   * Show config save snack
   */
  private showSaveSnack() {
    this.matSnackBar.open(
      this.translateService.instant('MAIN.SAVE_MESSAGE'),
      null,
      { duration: 1000 }
    );
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
    const appName: string = e?.target?.files?.[0]?.name;
    this.setApplication(appName);
  }

  /**
   * Set application from processes autocomplete list
   */
  public setApplicationFromList(e: MatAutocompleteSelectedEvent) {
    this.searchApplicationControl.setValue(null);
    this.setApplication(e.option.value);
  }

  /**
   * Set application and its data to form
   * @param appName application name
   */
  public setApplication(appName: string) {
    const appConfig = this.config$.getValue()?.applications?.[appName];
    this.form.patchValue({
      appName,
      ...(appConfig ?? defaultAppConfig)
    }, { emitEvent: !appConfig });
  }

  /**
   * On remove applcation callback
   * @param appName name of app
   */
  public removeApplication(appName: string) {
    const config = this.config$.getValue();
    delete config.applications[appName];
    this.config$.next(config);
    this.form.patchValue({
      appName: null,
      ...defaultAppConfig
    }, { emitEvent: false });
  }

  /**
   * Processes list input click.
   * Get async processes list with loading.
   */
  public onClickProcessesInput() {
    this.processesList$.next(null);
    this.isLoadingProcesses$.next(true);
    from(this.electronService.getProcessList())
      .subscribe(res => {
        this.processesList$.next(res);
        this.isLoadingProcesses$.next(false);
      });
  }

  /**
   * Processes autocomplete list close callback.
   * Clean up processes list and loading.
   */
  public onClosedAutocomplete() {
    this.processesList$.next(null);
    this.isLoadingProcesses$.next(false);
  }

  /**
   * Auto launch with windows toggle callback
   */
  public onChangeAutoLaunch(e: MatSlideToggleChange) {
    this.electronService.setAutoLaunch(e.checked).subscribe({
      next: () => this.showSaveSnack(),
      error: () => this.autoLaunchControl.setValue(!e.checked)
    });
  }

  /**
   * Launch minimized toggle callback
   */
  public onChangeLaunchMinimized(e: MatSlideToggleChange) {
    const config = this.config$.getValue();
    config.launchMinimized = e.checked;
    this.config$.next(config);
  }
}
