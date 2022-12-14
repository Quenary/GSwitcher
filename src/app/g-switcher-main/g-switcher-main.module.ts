import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GSwitcherMainRoutingModule } from './g-switcher-main-routing.module';
import { GSwitcherMainComponent } from './g-switcher-main.component';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle'

@NgModule({
  declarations: [
    GSwitcherMainComponent
  ],
  imports: [
    CommonModule,
    GSwitcherMainRoutingModule,
    MatButtonModule,
    MatSliderModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    TranslateModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatInputModule,
    MatSnackBarModule,
    MatSlideToggleModule
  ]
})
export class GSwitcherMainModule { }
