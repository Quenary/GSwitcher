import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { debounceTime, from, Observable, of, Subject, takeUntil } from 'rxjs';
import { isElectron } from '../decorators/electron.decorator';

@Component({
  selector: 'app-g-switcher-main',
  templateUrl: './g-switcher-main.component.html',
  styleUrls: ['./g-switcher-main.component.scss']
})
export class GSwitcherMainComponent
  implements OnInit, OnDestroy {

  public displays: string[] = ['12345', '67890'];
  public processList: string[] = [
    'code.exe', 'some.exe', 'other.exe', 'sys.exe', 'user.exe',
    'code.exe', 'some.exe', 'other.exe', 'sys.exe', 'user.exe',
    'code.exe', 'some.exe', 'other.exe', 'sys.exe', 'user.exe',
    'code.exe', 'some.exe', 'other.exe', 'sys.exe', 'user.exe',
    'code.exe', 'some.exe', 'other.exe', 'sys.exe', 'user.exe',
    'code.exe', 'some.exe', 'other.exe', 'sys.exe', 'user.exe',
    'code.exe', 'some.exe', 'other.exe', 'sys.exe', 'user.exe',
    'code.exe', 'some.exe', 'other.exe', 'sys.exe', 'user.exe',
    'code.exe', 'some.exe', 'other.exe', 'sys.exe', 'user.exe',
    'code.exe', 'some.exe', 'other.exe', 'sys.exe', 'user.exe',
    'code.exe', 'some.exe', 'other.exe', 'sys.exe', 'user.exe',
    'code.exe', 'some.exe', 'other.exe', 'sys.exe', 'user.exe',
  ];

  public displaysControl = new FormControl(null);

  public form: FormGroup = new FormGroup({
    appName: new FormControl(null, [Validators.required]),
    brightness: new FormControl(null, [Validators.required]),
    contrast: new FormControl(null, [Validators.required]),
    gamma: new FormControl(null, [Validators.required])
  });

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(
        debounceTime(1000),
        takeUntil(this.destroy$)
      ).subscribe(() => {
        if (this.form.valid) {
          this.saveApplicationData(this.form.value);
        }
      });
    this.displaysControl.valueChanges
      .pipe(
        debounceTime(1000),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        console.log(this.displaysControl.value)
        this.setDisplays(this.displaysControl.value);
      });
    // this.getDisplaysList().subscribe(res => {
    //   this.displays = res;
    // });
    // this.getProcessList().subscribe(res => {
    //   this.processList = res;
    // });
  }

  @isElectron()
  private setDisplays(displays: string[]) {
    window.electron.invoke(
      'gswitcher:set-displays',
      displays
    );
  }

  @isElectron()
  private saveApplicationData(formValue: any) {
    window.electron.invoke(
      'gswitcher:set-application-config',
      formValue.appName,
      formValue.brightness,
      formValue.contrast,
      formValue.gamma
    );
  }

  @isElectron(() => of([]))
  private getProcessList(): Observable<string[]> {
    return from(window.electron.invoke('gswitcher:get-process-list'));
  }

  @isElectron(() => of([]))
  private getDisplaysList(): Observable<string[]> {
    return from(window.electron.invoke('gswitcher:get-displays-list'));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public selectProcessFromList(item: string) {
    console.log(item)
  }

  public thumbFormatter(value: any) {
    return `${value}`;
  }

  public changeValue(value: any, field: string) {
    this.form.controls[field].setValue(value);
  }
}
