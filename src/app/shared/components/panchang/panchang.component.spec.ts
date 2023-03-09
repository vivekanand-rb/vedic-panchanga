import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanchangComponent } from './panchang.component';

describe('PanchangComponent', () => {
  let component: PanchangComponent;
  let fixture: ComponentFixture<PanchangComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PanchangComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanchangComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
