import { Component, OnInit } from '@angular/core';
import { PanchangService } from '@shared/services/panchang.service';

@Component({
  selector: 'panchang-calander-component',
  templateUrl: './panchang-calander.component.html',
  styleUrls: ['./panchang-calander.component.scss']
})
export class PanchangCalanderComponent implements OnInit {

  public calanderMonthArray:any = [];

  constructor(private _panchangService: PanchangService) { }

  ngOnInit(): void {
    this.getMonthDays(2023, 2);
  }

  getMonthDays(year:number, month: number): void{
    this.calanderMonthArray = [];
    let startDay: Date =  new Date(year, month, 1);
    let endDay: Date = new Date(year, month, 0);
    let monthDayList: Array<{ [key: string]: any }> = new Array(startDay.getDay());

    for(let day:number = 1; day <= endDay.getDate(); day++){
      if((monthDayList.length % 7 === 0)){
          this.calanderMonthArray.push(monthDayList);
          monthDayList = [];
      }
      monthDayList.push(this._panchangService.getPanchang(new Date(year, month, day)));
    }
    monthDayList.push(... new Array((monthDayList.length % 7)+1));
    this.calanderMonthArray.push(monthDayList);
  }

}
