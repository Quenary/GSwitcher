import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GSwitcherMainComponent } from './g-switcher-main.component';

const routes: Routes = [
  {
    path: '',
    component: GSwitcherMainComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GSwitcherMainRoutingModule { }
