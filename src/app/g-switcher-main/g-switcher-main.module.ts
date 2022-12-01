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
    MatMenuModule
  ]
})
export class GSwitcherMainModule { }
