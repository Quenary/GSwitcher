import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GSwitcherMainComponent } from './g-switcher-main.component';

describe('GSwitcherMainComponent', () => {
  let component: GSwitcherMainComponent;
  let fixture: ComponentFixture<GSwitcherMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GSwitcherMainComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GSwitcherMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
