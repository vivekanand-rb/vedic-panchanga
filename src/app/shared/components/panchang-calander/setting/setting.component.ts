import { Component, OnInit, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'panchang-setting-component',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent implements OnInit {
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
