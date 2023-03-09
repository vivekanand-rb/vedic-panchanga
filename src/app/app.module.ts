import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import {HttpClientModule} from '@angular/common/http';
import { PanchangCalanderComponent } from './shared/components/panchang-calander/panchang-calander.component';
import { PanchangComponent } from './shared/components/panchang/panchang.component';
import { ToggleComponent } from './shared/elements/toggle/toggle.component'

@NgModule({
  declarations: [
    AppComponent,
    PanchangCalanderComponent,
    PanchangComponent,
    ToggleComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
