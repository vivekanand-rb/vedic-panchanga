import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { response } from 'express';

@Injectable({ providedIn: 'root'})

export class LocationService {
    constructor(private _http: HttpClient) { }

    public async getAndAssignLocationObj(isLocationObjAssigned: Function): Promise<void> {
        if (!localStorage.getItem('locationObject')) {
          //TODO:  To be replaced by library to get location info.
           await firstValueFrom(this._http.get("http://ip-api.com/json")).then((loacationResponse: { [key: string]: any })=>{
            loacationResponse['elevation'] = 0.02
            localStorage.setItem('locationObject', JSON.stringify(loacationResponse));
            isLocationObjAssigned(true);
          }).catch(()=>{
            isLocationObjAssigned(false);
          });
        } else {
          isLocationObjAssigned(true);
        }
      }
    
    public getLocationObj(): any{
       let obj: string| null = localStorage.getItem('locationObject');
       return obj ? JSON.parse(obj): obj;
    }
}