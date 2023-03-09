import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanchangCalanderComponent } from './panchang-calander.component';

describe('PanchangCalanderComponent', () => {
  let component: PanchangCalanderComponent;
  let fixture: ComponentFixture<PanchangCalanderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PanchangCalanderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanchangCalanderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
