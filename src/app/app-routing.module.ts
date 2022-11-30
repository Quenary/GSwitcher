import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'g-switcher-main',
    pathMatch: 'full'
  },
  {
    path: 'g-switcher-main',
    loadChildren: () => import('./g-switcher-main/g-switcher-main.module').then(m => m.GSwitcherMainModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
