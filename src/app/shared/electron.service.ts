import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { EInvokeEventName } from 'src/electron/electron-enums';
import type { IGSwitcherConfig } from 'src/electron/gswitcher-storage';
import { isElectron } from '../decorators/electron.decorator';

/**
 * Wrapper to electron main process handlers
 */
@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  constructor() { }

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
  @isElectron(() => of<IGSwitcherConfig>({ launchMinimized: false, displays: [], applications: {} }))
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
}