import { Component } from '@angular/core';

@Component({
  selector: 'app-g-switcher-main',
  templateUrl: './g-switcher-main.component.html',
  styleUrls: ['./g-switcher-main.component.scss']
})
export class GSwitcherMainComponent {
  invokeNode() {
    window.electron.invoke('gswitcher:getCoordinates')
      .then(res => console.log(res))
      .catch(err => console.log(err));
  }

}
