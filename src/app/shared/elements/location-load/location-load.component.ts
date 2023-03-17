import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LocationService } from '@shared/services/location.service';

@Component({
  selector: 'panchang-location-load',
  templateUrl: './location-load.component.html',
  styleUrls: ['./location-load.component.scss']
})
export class LocationComponent implements OnInit {
  public display = "none";
  private firstLoad: boolean = false;
  @Output() locationServiceCallCompleted:EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(private _locationService: LocationService ) { }

  ngOnInit(): void {
    this.firstLoad = this._locationService.getLocationObj() ? false: true;
    this.display = "block";
    if(this.firstLoad){
      this._locationService.getAndAssignLocationObj(this.locationObjAssigned.bind(this));
    }else{
      this.locationObjAssigned(true);
    }
  }

  locationObjAssigned(isLoaded: boolean):void{
      this.locationServiceCallCompleted.emit(isLoaded);
      this.display = "none";
  }


}
