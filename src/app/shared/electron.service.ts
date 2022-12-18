import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { EInvokeEventName } from 'src/electron/electron-enums';
import type { IGSwitcherConfig, IGSwitcherConfigApplication } from 'src/electron/gswitcher-storage';
import { isElectron } from '../decorators/electron.decorator';
import { IVersionCheckResponse } from '../interfaces/version-check';

/**
 * Wrapper to electron main process handlers
 */
@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  constructor() { }

  /**
   * Get application version
   */
  @isElectron(() => of('0.0.0'))
  public getAppVersion(): Observable<string> {
    return from(window.electron.invoke(EInvokeEventName['gswitcher:get-app-version']));
  }

  /**
   * Get list of active processes
   */
  @isElectron(() => of([
    'code.exe', 'some.exe', 'other.exe', 'sys.exe', 'user.exe', 'blablablablabla.exe'
  ]))
  public getProcessList(): Observable<string[]> {
    return from(window.electron.invoke(EInvokeEventName['gswitcher:get-process-list']));
  }

  /**
   * Get list of connected displays
   */
  @isElectron(() => of(['DISPLAY_1', 'DISPLAY_2']))
  public getDisplaysList(): Observable<string[]> {
    return from(window.electron.invoke(EInvokeEventName['gswitcher:get-displays-list']));
  }

  /**
   * Get config from config file
   */
  @isElectron(() => of<IGSwitcherConfig>({ checkUpdates: true, launchMinimized: false, displays: [], applications: {} }))
  public getConfig(): Observable<IGSwitcherConfig> {
    return from(window.electron.invoke(EInvokeEventName['gswitcher:get-config']));
  }

  /**
   * Set application config
   * @param config 
   */
  @isElectron()
  public setConfig(config: IGSwitcherConfig) {
    window.electron.invoke(
      EInvokeEventName['gswitcher:set-config'],
      config
    );
  }

  /**
   * Get auto launch with windows flag
   */
  @isElectron(() => of(false))
  public getAutoLaunch(): Observable<boolean> {
    return from(window.electron.invoke(EInvokeEventName['gswitcher:get-auto-launch']));
  }

  /**
   * Set auto launch with windows flag
   */
  @isElectron(() => of(null))
  public setAutoLaunch(flag: boolean) {
    return from(window.electron.invoke(EInvokeEventName['gswitcher:set-auto-launch'], flag));
  }

  /**
   * Check version update
   */
  @isElectron(() => of(null))
  public checkVersion(): Observable<IVersionCheckResponse> {
    return from(window.electron.invoke(EInvokeEventName['gswitcher:check-version']));
  }

  /**
   * Opens external link in browser
   * @param link link
   */
  @isElectron()
  public openExternalLink(link: string) {
    window.electron.invoke(EInvokeEventName['gswitcher:open-external-link'], link);
  }

  /**
   * Quits app
   */
  @isElectron()
  public quit() {
    window.electron.invoke(EInvokeEventName['gswitcher:quit']);
  }

  /**
   * Set values for live preview
   * @param values values
   */
  @isElectron()
  public setLivePreviewValues(values: IGSwitcherConfigApplication) {
    window.electron.invoke(EInvokeEventName['gswitcher:set-live-preview-values'], values);
  }

  /**
   * Set live preview active flag
   * @param value flag
   */
  @isElectron()
  public setLivePreviewActive(value: boolean) {
    window.electron.invoke(EInvokeEventName['gswitcher:set-live-preview-active'], value);
  }
}
