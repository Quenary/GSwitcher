import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { EAppUrls } from 'src/electron/electron-enums';
import { ElectronService } from '../shared/electron.service';
import { GSwitcherNewVersionDialogComponent } from './gswitcher-new-version-dialog/gswitcher-new-version-dialog.component';

@Component({
  selector: 'app-gswitcher-header',
  templateUrl: './gswitcher-header.component.html',
  styleUrls: ['./gswitcher-header.component.scss']
})
export class GSwitcherHeaderComponent {

  constructor(
    private electronService: ElectronService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private translateService: TranslateService
  ) { }

  public openRepository() {
    this.electronService.openExternalLink(EAppUrls.repo);
  }

  public checkUpdates() {
    this.electronService.checkVersion().subscribe(data => {
      if (!!data) {
        const dialogRef = this.matDialog.open(GSwitcherNewVersionDialogComponent, { data });
        dialogRef.afterClosed().subscribe(link => {
          if (!!link) {
            this.electronService.openExternalLink(link);
          }
        });
      }
      else {
        this.matSnackBar.open(
          this.translateService.instant('HEADER.NEW_VERSION_DIALOG.NO_UPDATES'),
          null,
          { duration: 1000 }
        );
      }
    });
  }

  public quit() {
    this.electronService.quit();
  }
}
