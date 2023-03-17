import { Component, OnInit } from '@angular/core';
import { LocationService } from '@shared/services/location.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public title:string = 'vedic-panchang';
  public viewCalander: boolean = true;
  public locationLoaded: boolean = false;
  public modifyLocationObj: boolean = false;
 
  constructor(private _locationService: LocationService) {
  }

  ngOnInit(): void {
    this.locationLoaded = this._locationService.getLocationObj() ? true: false;
  }

  locationCallCompleted(isLoaded:boolean):void{
    this.locationLoaded = isLoaded;
  }

}
