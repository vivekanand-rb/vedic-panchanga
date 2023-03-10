import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public title:string = 'vedic-panchang';
  public viewCalander: boolean = true;
 
  constructor() {
  }

  ngOnInit(): void {
  }


}
