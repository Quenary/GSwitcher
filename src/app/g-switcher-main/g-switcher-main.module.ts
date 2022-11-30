import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GSwitcherMainRoutingModule } from './g-switcher-main-routing.module';
import { GSwitcherMainComponent } from './g-switcher-main.component';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  declarations: [
    GSwitcherMainComponent
  ],
  imports: [
    CommonModule,
    GSwitcherMainRoutingModule,
    MatButtonModule
  ]
})
export class GSwitcherMainModule { }
