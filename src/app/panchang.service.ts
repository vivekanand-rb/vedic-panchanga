import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, switchMap } from 'rxjs';
import * as AstroEngine from 'astronomy-engine';
@Injectable({
  providedIn: 'root'
})
export class PanchangService {
  private panchangObj: { [key: string]: any } = {};

  constructor(private _http: HttpClient) { }

  getPanchang(date: Date): object {
    this.getAndAssignLocationObj(this.panchangObj);
    this.panchangObj["date"] = this.getDateObj(date);
    this.panchangObj["observer"] = this.getAstroObserver(this.panchangObj['locationObj']['lat'], this.panchangObj['locationObj']['lon'], this.panchangObj['locationObj']['elevation']);
    this.panchangObj["sunRiseSet"] = this.getSunRiseSet(this.panchangObj["observer"], this.panchangObj["date"]["dateWithZeroHours"]);
    this.panchangObj["moonRiseSet"] = this.getMoonRiseSet(this.panchangObj["observer"], this.panchangObj['sunRiseSet']['rise']['date'])
    this.panchangObj["vedicDay"] = this.getWaar(this.panchangObj['date']['dateObj'], this.panchangObj['sunRiseSet']['rise']['date']);
    this.panchangObj["sunLatLong"] = this.getSunLatLong(this.panchangObj['date']['astroDate']);
    this.panchangObj["moonLatLong"] = this.getMoonLatLong(this.panchangObj['date']['astroDate']);
    this.panchangObj["tithi"] = this.getTithi(this.panchangObj["date"], this.panchangObj["observer"], this.panchangObj['sunRiseSet']['rise']['date'], this.panchangObj['sunLatLong']['elon'], this.panchangObj['moonLatLong']['elon']);
    return this.panchangObj;
  }


  getTithi(dateObj: { [key: string]: any }, observer: AstroEngine.Observer, sunRiseTime: Date, currentSunLong: number, currentMoonLong: number): object {
    let tithiObj: { [key: string]: any } = {};
    let sunRiseAsrtoTimeObj = this.getAstroDate(sunRiseTime);
    tithiObj['phase'] = Math.abs((currentMoonLong - currentSunLong) % 360); //360 value
    tithiObj['tithi'] = Math.ceil(tithiObj['phase'] / 12);  // 30 days
    tithiObj['degreesLeft'] = (tithiObj['tithi'] * 12) - tithiObj['phase'];

    let offsets = [0.25, 0.5, 0.75, 1.0];
    let relative_motion = offsets.map((t) => {
      return Math.abs(Math.abs((this.getMoonLatLong(sunRiseAsrtoTimeObj.AddDays(t))['elon'] - this.getMoonLatLong(sunRiseAsrtoTimeObj)['elon']) % 360) - Math.abs((this.getSunLatLong(sunRiseAsrtoTimeObj.AddDays(t))['elon'] - this.getSunLatLong(sunRiseAsrtoTimeObj)['elon']) % 360))
    });

    console.log('off difference...', relative_motion);
    let approx_end = this.inverseLagrange(offsets, relative_motion, tithiObj['degreesLeft']) * 24;
    tithiObj['tithiEnd'] = new Date(dateObj['timeStamp'] + this.convertDegreesToMilliseconds(approx_end)['millisec']);


    //Check for skipped tithi
    let nextPhase = this.getMoonLatLong(sunRiseAsrtoTimeObj.AddDays(1))['elon'];
    let nextTithi = Math.ceil(nextPhase / 12);
    let isSkipped = (nextTithi - tithiObj['tithi']) % 30 > 1;
    if (isSkipped) {
      console.log('tithi is skipped for:', dateObj['dateObj']);
      tithiObj['tithi'] = tithiObj['tithi'] + 1;
      tithiObj['degreesLeft'] = (tithiObj['tithi'] * 12) - tithiObj['phase'];
      approx_end = this.inverseLagrange(offsets, relative_motion, tithiObj['degreesLeft']) * 24;
      tithiObj['tithiEnd'] = new Date(dateObj['timeStamp'] + this.convertDegreesToMilliseconds(approx_end)['millisec']);
    }

    tithiObj['paksha'] = tithiObj['tithi'] > 15 ? 2 : 1;
    return tithiObj;
  }


  convertDegreesToMilliseconds(degrees: number): { millisec: number, Hr_Min_Sec: Array<number> } {
    let d = Math.floor(degrees);
    let mins = (degrees - d) * 60;
    let m = Math.floor(mins);
    let s = (mins - m) * 60;
    return { millisec: (d * 60 * 60 * 1000) + (m * 60 * 1000) + (s * 1000), Hr_Min_Sec: [d, m, s] };
  }

  inverseLagrange(x: Array<number>, y: Array<number>, ya: number): number {
    // Given two lists x and y, find the value of x = xa when y = ya, i.e., f(xa) = ya;
    let denom, numer, total;
    total = 0;
    if (x.length === y.length) {
      for (let i = 0; i < x.length; i++) {
        numer = 1; denom = 1;
        for (let j = 0; j < x.length; j++) {
          if (j !== i) {
            numer *= (ya - y[j]);
            denom *= (y[i] - y[j]);
          }
        }
        total += ((numer * x[i]) / denom);
      }
    }
    return total;
  }


  getWaar(date: Date, sunRiseDate: Date): number {
    let day = date.getDay() + 1;
    if (date.getTime() < sunRiseDate.getTime()) {
      day = day - 1;
    }
    return day;
  }

  getSunLatLong(date: AstroEngine.AstroTime): { [key: string]: any } {
    return AstroEngine.Ecliptic(AstroEngine.GeoVector(AstroEngine.Body.Sun, date, false));
  }

  getMoonLatLong(date: AstroEngine.AstroTime): { [key: string]: any } {
    return AstroEngine.Ecliptic(AstroEngine.GeoVector(AstroEngine.Body.Moon, date, false));
  }

  getSunRiseSet(observer: AstroEngine.Observer, dateWithZeroHour: Date): object {
    const astroDate = this.getAstroDate(dateWithZeroHour);
    const sunRiseSetObject: any = { rise: AstroEngine.SearchRiseSet(AstroEngine.Body.Sun, observer, +1, astroDate, 1), set: AstroEngine.SearchRiseSet(AstroEngine.Body.Sun, observer, -1, astroDate, 1) };
    sunRiseSetObject['riseString'] = sunRiseSetObject['rise']['date'].toLocaleTimeString([], { hour12: true });
    sunRiseSetObject['setString'] = sunRiseSetObject['set']['date'].toLocaleTimeString([], { hour12: true });
    return sunRiseSetObject;
  }

  getMoonRiseSet(observer: AstroEngine.Observer, sunRiseDate: Date): object {
    const moonRiseSetObject: any = { rise: AstroEngine.SearchRiseSet(AstroEngine.Body.Moon, observer, +1, sunRiseDate, 1), set: AstroEngine.SearchRiseSet(AstroEngine.Body.Moon, observer, -1, sunRiseDate, 1) };
    moonRiseSetObject['riseString'] = moonRiseSetObject['rise']['date'].toLocaleTimeString([], moonRiseSetObject['rise']['date'].getDate() !== sunRiseDate.getDate() ? { hour12: true, day: 'numeric', month: 'short' } : { hour12: true }).replace(',', '');
    moonRiseSetObject['setString'] = moonRiseSetObject['set']['date'].toLocaleTimeString([], moonRiseSetObject['set']['date'].getDate() !== sunRiseDate.getDate() ? { hour12: true, day: 'numeric', month: 'short' } : { hour12: true }).replace(',', '');
    return moonRiseSetObject;
  }

  getAstroDate(date: Date): AstroEngine.AstroTime {
    return AstroEngine.MakeTime(date);
  }

  getAstroObserver(lat: number, long: number, elevation: number): AstroEngine.Observer {
    return new AstroEngine.Observer(lat, long, elevation);
  }

  getDateObj(date: Date): object {
    let zeroHourDate = new Date(date);
    zeroHourDate.setHours(0, 0, 0, 0);
    return {
      dateObj: date,
      hours: date.getHours(),
      minutes: date.getMinutes(),
      seconds: date.getMilliseconds(),
      day: date.getDay(),
      date: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      timeStamp: date.getTime(),
      timezone: date.toTimeString().slice(9),
      timezoneOffset: date.getTimezoneOffset(),
      dateString: date.toDateString(),
      localeDateString: date.toLocaleDateString(),
      UTCdate: date.getUTCDate(),
      UTCdateString: date.toUTCString(),
      astroDate: this.getAstroDate(date),
      dateWithZeroHours: zeroHourDate,
      dateStringWithZeroHours: zeroHourDate.toString(),
      todaysDate: date.toLocaleDateString() === new Date().toLocaleDateString()
    }
  }

  async getAndAssignLocationObj(assignableObjRef: { [key: string]: any }) {
    if (!sessionStorage.getItem('locationObject')) {
      const loacationResponse = await firstValueFrom(this._http.get("http://ip-api.com/json").pipe(switchMap(async (response: any) => {
        const eleVationResponse: any = await firstValueFrom(this._http.get("https://api.open-elevation.com/api/v1/lookup?locations=" + response['lat'] + "," + response['lon']));
        response['elevation'] = eleVationResponse['results'][0]['elevation'] / 1000;
        return response;
      })));
      sessionStorage.setItem('locationObject', JSON.stringify(loacationResponse));
      assignableObjRef["locationObj"] = loacationResponse;
    } else {
      assignableObjRef["locationObj"] = JSON.parse(String(sessionStorage.getItem('locationObject')));
    }
  }

}
