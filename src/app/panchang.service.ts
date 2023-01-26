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
    this.panchangObj["relativeMothionOffsets"] = [0.00, 0.25, 0.50, 0.75, 1.00];
    this.panchangObj["date"] = this.getDateObj(date);
    this.panchangObj["observer"] = this.getAstroObserver(this.panchangObj['locationObj']['lat'], this.panchangObj['locationObj']['lon'], this.panchangObj['locationObj']['elevation']);
    this.panchangObj["sunRiseSet"] = this.getSunRiseSet(this.panchangObj["observer"], this.panchangObj["date"]["dateWithZeroHours"]);
    this.panchangObj["moonRiseSet"] = this.getMoonRiseSet(this.panchangObj["observer"], this.panchangObj['sunRiseSet']['rise']['date'])
    this.panchangObj["vedicDay"] = this.getVaara(this.panchangObj['date']['dateObj'], this.panchangObj['sunRiseSet']['rise']['date']);
    this.panchangObj["sunLatLong"] = this.getSunLatLong(this.panchangObj['date']['astroDate']);
    this.panchangObj["moonLatLong"] = this.getMoonLatLong(this.panchangObj['date']['astroDate']);
    this.panchangObj['sunRiseAstotimeObj'] = this.getAstroDate(this.panchangObj['sunRiseSet']['rise']['date']);
    this.panchangObj["tithiObj"] = this.getTithi(this.panchangObj["date"], this.panchangObj['sunRiseAstotimeObj'], this.panchangObj['sunLatLong']['elon'], this.panchangObj['moonLatLong']['elon'], this.panchangObj["relativeMothionOffsets"].slice(1));
    this.panchangObj["nakshatraObj"] = this.getNakshatra(this.panchangObj["date"], this.panchangObj['sunRiseSet']['rise']['date'], this.panchangObj['sunRiseAstotimeObj'], this.panchangObj["relativeMothionOffsets"]);
    return this.panchangObj;
  }

  getNakshatra(dateObj: { [key: string]: any }, sunRiseDate: Date, sunRiseAstroTime: AstroEngine.AstroTime, offsets: Array<number>): { [key: string]: any } {
    let nakshatraObj: { [key: string]: any } = {};
    let relativeLongitudes: Array<number> = offsets.map((t) => {
      let moonRelativeSubstitution: number = this.getMoonLatLong(sunRiseAstroTime.AddDays(t))['elon'] - this.getAayamsha(sunRiseDate);
      moonRelativeSubstitution = moonRelativeSubstitution < 0 ? (moonRelativeSubstitution + 360) : moonRelativeSubstitution;
      return moonRelativeSubstitution;
    });

    nakshatraObj['nakshatra'] = Math.ceil(relativeLongitudes[0] * 27 / 360);
    relativeLongitudes = this.unwrapAngles(relativeLongitudes);
    let approx_end: number = this.inverseLagrange(offsets, relativeLongitudes, nakshatraObj['nakshatra'] * 360 / 27) * 24;
    nakshatraObj['nakshatraEndTime'] = new Date(sunRiseDate.getTime() + this.convertHoursToMilliseconds(approx_end)['millisec']);

    let nextNakshatra: number = Math.ceil(relativeLongitudes[relativeLongitudes.length - 1] * 27 / 360);
    nakshatraObj['substituionValueSkipCheck'] = nextNakshatra;
    nextNakshatra = nextNakshatra < 0 ? (nextNakshatra + 27) : nextNakshatra;
    let isSkipped: boolean = (nextNakshatra - nakshatraObj['nakshatra']) % 27 > 1;
    if (isSkipped) {
      debugger
      nakshatraObj['nakshatra'] = nakshatraObj['nakshatra'] + 1;
      approx_end = this.inverseLagrange(offsets, relativeLongitudes, nakshatraObj['nakshatra'] * 360 / 27) * 24;
      nakshatraObj['nakshatraEndTime'] = new Date(dateObj['timeStamp'] + this.convertHoursToMilliseconds(approx_end)['millisec']);
    }
    return nakshatraObj;
  }

  getTithi(dateObj: { [key: string]: any }, sunRiseAstroTime: AstroEngine.AstroTime, currentSunLong: number, currentMoonLong: number, offsets: Array<number>): { [key: string]: any } {
    let tithiObj: { [key: string]: any } = {};
    tithiObj['substituionValue'] = (currentMoonLong - currentSunLong);
    tithiObj['phase'] = tithiObj['substituionValue'] < 0 ? (360 + tithiObj['substituionValue']) : tithiObj['substituionValue'];
    tithiObj['tithi'] = Math.ceil(tithiObj['phase'] / 12);
    tithiObj['degreesLeft'] = (tithiObj['tithi'] * 12) - tithiObj['phase'];  /* <-- degree in radian */

    let relativeMotion: Array<number> = offsets.map((t) => {
      let moonRelativeSubstitution: number = this.getMoonLatLong(sunRiseAstroTime.AddDays(t))['elon'] - this.getMoonLatLong(sunRiseAstroTime)['elon'];
      let sunRelativeSubstitution: number = this.getSunLatLong(sunRiseAstroTime.AddDays(t))['elon'] - this.getSunLatLong(sunRiseAstroTime)['elon'];
      moonRelativeSubstitution = moonRelativeSubstitution < 0 ? (moonRelativeSubstitution + 360) : moonRelativeSubstitution;
      sunRelativeSubstitution = sunRelativeSubstitution < 0 ? (sunRelativeSubstitution + 360) : sunRelativeSubstitution;
      let relativeSubstitution: number = moonRelativeSubstitution - sunRelativeSubstitution;
      return relativeSubstitution < 0 ? (relativeSubstitution + 360) : relativeSubstitution;
    });

    let approx_end: number = this.inverseLagrange(offsets, relativeMotion, tithiObj['degreesLeft']) * 24; /* <-- radian to hour */
    tithiObj['tithiEnd'] = new Date(dateObj['timeStamp'] + this.convertHoursToMilliseconds(approx_end)['millisec']);

    /* check for skipped tithi -- not validated */
    let nextPhase: number = this.getMoonLatLong(sunRiseAstroTime.AddDays(1))['elon'] - this.getSunLatLong(sunRiseAstroTime.AddDays(1))['elon'];
    tithiObj['substituionValueSkipCheck'] = nextPhase;
    nextPhase = nextPhase < 0 ? (360 + nextPhase) : nextPhase;
    let nextTithi = (Math.ceil(nextPhase / 12) - tithiObj['tithi']);
    nextTithi = nextTithi < 0 ? (nextTithi + 30) : nextTithi;
    let isSkipped: boolean = (nextTithi % 30) > 1;
    if (isSkipped) {
      debugger
      tithiObj['phase'] = nextPhase;
      tithiObj['tithi'] = tithiObj['tithi'] + 1 % 30;
      tithiObj['degreesLeft'] = (tithiObj['tithi'] * 12) - tithiObj['phase'];
      approx_end = this.inverseLagrange(offsets, relativeMotion, tithiObj['degreesLeft']) * 24;
      tithiObj['tithiEnd'] = new Date(dateObj['timeStamp'] + this.convertHoursToMilliseconds(approx_end)['millisec']);
    }

    tithiObj['paksha'] = tithiObj['tithi'] > 15 ? 2 : 1;
    return tithiObj;
  }


  unwrapAngles(degreeAngles: Array<number>): Array<number> {
    for (let i = 1; i < degreeAngles.length; i++) {
      if (degreeAngles[i] < degreeAngles[i - 1]) {
        degreeAngles[i] += 360;
      }
    }
    return degreeAngles;
  }


  getAayamsha(sunRiseDate: Date, correctionIndex: number = 0): number {
    const correctionSystem = [{ '0': 'lahiri', 'startYear': 285, 'movement': 50.2791 }, { '0': 'lahiri', 'startYear': 291, 'movement': 50.2388475 }, { '2': 'raman', 'startYear': 297, 'movement': 50.33 }];
    const year = sunRiseDate.getFullYear() - correctionSystem[correctionIndex]['startYear'];
    return ((year * correctionSystem[correctionIndex]['movement']) / 60) / 60;
  }

  convertHoursToMilliseconds(hours: number): { millisec: number, Hr_Min_Sec: Array<number> } {
    let h: number = Math.floor(hours);
    let mins: number = (hours - h) * 60;
    let m: number = Math.floor(mins);
    let s: number = (mins - m) * 60;
    return { millisec: (h * 60 * 60 * 1000) + (m * 60 * 1000) + (s * 1000), Hr_Min_Sec: [h, m, s] };
  }

  inverseLagrange(x: Array<number>, y: Array<number>, ya: number): number {
    // Given two lists x and y, find the value of x = xa when y = ya, i.e., f(xa) = ya;
    let denom: number, numer: number, total: number;
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


  getVaara(date: Date, sunRiseDate: Date): number {
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
