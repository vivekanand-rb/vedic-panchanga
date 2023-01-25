import { Component, OnInit } from '@angular/core';
import { PanchangService } from './panchang.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'vedic-panchang';
  constructor(private _panchangService: PanchangService){ 
  }

 ngOnInit(): void {
   console.log(this._panchangService.getPanchang(new Date()));
 }


}
