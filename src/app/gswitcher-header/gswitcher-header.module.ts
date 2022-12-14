import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { GSwitcherHeaderComponent } from "./gswitcher-header.component";
import { GSwitcherNewVersionDialogComponent } from "./gswitcher-new-version-dialog/gswitcher-new-version-dialog.component";
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@NgModule({
    declarations: [
        GSwitcherHeaderComponent,
        GSwitcherNewVersionDialogComponent
    ],
    imports: [
        CommonModule,
        TranslateModule,
        MatButtonModule,
        MatMenuModule,
        MatIconModule,
        MatDialogModule,
        MatSnackBarModule
    ],
    exports: [
        GSwitcherHeaderComponent,
    ]
})
export class GSwitcherHeaderModule { }