import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { PanchangService } from '@shared/services/panchang.service';
import { LocationService } from '@shared/services/location.service';
@Component({
  selector: 'panchang-component',
  templateUrl: './panchang.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./panchang.component.scss']
})
export class PanchangComponent implements OnInit {

  @Input()
   set refresh(locationUpdateTimeStamp: number) {
    if(locationUpdateTimeStamp){
      this.locationObj = this._locationService.getLocationObj();
      this.getView(null, true);
    }
  }
  
  public panchangObject: any = {};
  public customDate: any;
  private locationObj: { [key: string]: any } = {};
  constructor(private _locationService: LocationService, private _panchangService: PanchangService) { }

  ngOnInit(): void {
    this.locationObj = this._locationService.getLocationObj();
    this.getView();
  }

  getView(event?: any, clearCustomDate?: boolean): void {
    // issue in inversion of date : 1677174883080 / tithi : 1677180745998
    if(clearCustomDate){
      this.customDate = null;
    }
    let obj: any = this._panchangService.getPanchang(event && event.target ? new Date(event.target.value) :new Date(), this.locationObj);
    console.log(obj);
    this.panchangObject = obj;
  }

}
