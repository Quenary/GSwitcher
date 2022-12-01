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
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar'

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
    MatMenuModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule
  ]
})
export class GSwitcherMainModule { }
