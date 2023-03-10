import { Component, OnInit } from '@angular/core';
import { PanchangService } from '@shared/services/panchang.service';

@Component({
  selector: 'panchang-calander-component',
  templateUrl: './panchang-calander.component.html',
  styleUrls: ['./panchang-calander.component.scss']
})
export class PanchangCalanderComponent implements OnInit {

  public calanderMonthArray: any = [];
  public todaysDate: Date = new Date();
  public selectedMonth: number = 0;
  public selectedYear: number = 0;
  public monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  public showSetting: boolean = false; 

  constructor(private _panchangService: PanchangService) { }

  ngOnInit(): void {
    this.selectedYear = this.todaysDate.getFullYear();
    this.selectedMonth = this.todaysDate.getMonth();
    this.getMonthDays(this.selectedYear, this.selectedMonth);
  }

  dayClicked(dayPanchangObj: { [key: string]: any }): void{
    console.log(dayPanchangObj)
  }

  navigate(value: number):void {
    this.selectedMonth = this.selectedMonth + value;
    if (this.selectedMonth < 0) {
      this.selectedMonth = 11;
      this.selectedYear = this.selectedYear - 1;
    }
    if (this.selectedMonth > 11) {
      this.selectedMonth = 0;
      this.selectedYear = this.selectedYear + 1;
    }
    this.getMonthDays(this.selectedYear, this.selectedMonth);
  }

  getMonthDays(year: number, month: number): void {
    this.calanderMonthArray = [];

    let startDay: Date = new Date(year, month, 1);
    let endDay: Date = new Date(year, month + 1, 0);
    let monthDayList: Array<{ [key: string]: any }> = new Array(startDay.getDay());

    for (let day: number = 1; day <= endDay.getDate(); day++) {
      if ((monthDayList.length % 7 === 0)) {
        this.calanderMonthArray.push(monthDayList);
        monthDayList = [];
      }
      monthDayList.push(this._panchangService.getPanchang(new Date(year, month, day)));
    }
    monthDayList.push(... new Array(7 - monthDayList.length));
    this.calanderMonthArray.push(monthDayList);
  }

}
