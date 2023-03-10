import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import {HttpClientModule} from '@angular/common/http';
import { PanchangCalanderComponent } from './shared/components/panchang-calander/panchang-calander.component';
import { PanchangComponent } from './shared/components/panchang/panchang.component';
import { ToggleComponent } from './shared/elements/toggle/toggle.component';
import { SettingComponent } from './shared/components/panchang-calander/setting/setting.component'
import { FormsModule } from '@angular/forms';
@NgModule({
  declarations: [
    AppComponent,
    PanchangCalanderComponent,
    PanchangComponent,
    ToggleComponent,
    SettingComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
