import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { PanchangService } from '@shared/services/panchang.service';

@Component({
  selector: 'panchang-component',
  templateUrl: './panchang.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./panchang.component.scss']
})
export class PanchangComponent implements OnInit {

  public panchangObject: any = {};
  public customDate: any;
  constructor(private _panchangService: PanchangService) { }

  ngOnInit(): void {
    this.getView();
  }

  getView(event?: any, clearCustomDate?: boolean): void {
    // issue in inversion of date : 1677174883080 / tithi : 1677180745998
    if(clearCustomDate){
      this.customDate = null;
    }
    let obj: any = this._panchangService.getPanchang(event && event.target ? new Date(event.target.value) :new Date());
    console.log(obj);
    this.panchangObject = obj;
  }

}
