import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { LocationService } from '@shared/services/location.service';
@Component({
  selector: 'panchang-location-modify-component',
  templateUrl: './location-modify.component.html',
  styleUrls: ['./location-modify.component.scss']
})
export class LocationModifyComponent implements OnInit {

  public display = "none";
  public locationObj: { [key: string]: any } = {};
  @Output() closed:EventEmitter<boolean> = new EventEmitter<boolean>();
  constructor(private _locationService: LocationService) { }

  ngOnInit(): void {
    this.display = "block";
    this.locationObj = this._locationService.getLocationObj();
    // ^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$
  }

  onCloseHandled() {
    this.closed.emit(true);
    this.display = "none";
  }
}
