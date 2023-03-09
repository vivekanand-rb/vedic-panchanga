import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';



@Component({
  selector: 'panchang-toggle',
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.scss']
})
export class ToggleComponent implements OnInit {
  @Input() displayValues: [string,string] = ['',''];
  @Output() valueChanged:EventEmitter<boolean> = new EventEmitter<boolean>();
  public selection: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  selectionChanged():void{
    this.selection = !this.selection;
    this.valueChanged.emit(this.selection);
  }

}
