import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationModifyComponent } from './location-modify.component';

describe('LocationModifyComponent', () => {
  let component: LocationModifyComponent;
  let fixture: ComponentFixture<LocationModifyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LocationModifyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationModifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
