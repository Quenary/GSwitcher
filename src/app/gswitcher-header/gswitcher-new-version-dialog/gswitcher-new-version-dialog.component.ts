import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IVersionCheckResponse } from 'src/app/interfaces/version-check';

@Component({
  selector: 'app-gswitcher-new-version-dialog',
  templateUrl: './gswitcher-new-version-dialog.component.html',
  styleUrls: ['./gswitcher-new-version-dialog.component.scss']
})
export class GSwitcherNewVersionDialogComponent {

  public version: string;

  constructor(
    private dialogRef: MatDialogRef<GSwitcherNewVersionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: IVersionCheckResponse
  ) {
    this.version = data.tag.name;
  }

  public apply() {
    this.dialogRef.close(this.data.url);
  }

  public cancel() {
    this.dialogRef.close();
  }
}
