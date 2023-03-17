import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'panchang-location-modify-component',
  templateUrl: './location-modify.component.html',
  styleUrls: ['./location-modify.component.scss']
})
export class LocationModifyComponent implements OnInit {

  public display = "none";
  @Output() closed:EventEmitter<boolean> = new EventEmitter<boolean>();
  constructor() { }

  ngOnInit(): void {
    this.display = "block";
  }

  onCloseHandled() {
    this.closed.emit(true);
    this.display = "none";
  }
}
