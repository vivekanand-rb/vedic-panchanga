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
    this.panchangObj = {};
    this.getAndAssignLocationObj(this.panchangObj);
    this.panchangObj["relativeMotionOffsets"] = [0.00, 0.25, 0.50, 0.75, 1.00];
    this.panchangObj["date"] = this.getDateObj(date, true);
    this.panchangObj["observer"] = this.getAstroObserver(this.panchangObj['locationObj']['lat'], this.panchangObj['locationObj']['lon'], this.panchangObj['locationObj']['elevation']);
    this.panchangObj["sunRiseSet"] = this.getSunRiseSet(this.panchangObj["observer"], new Date(this.panchangObj["date"]["dateWithZeroHours"]));
    this.panchangObj["moonRiseSet"] = this.getMoonRiseSet(this.panchangObj["observer"], this.panchangObj['sunRiseSet']['rise']['date'])
    this.panchangObj["vedicDayObj"] = this.getVaara(this.panchangObj['date']['dateObj'], this.panchangObj['sunRiseSet']['rise']['date']);
    this.panchangObj["sunLatLong"] = this.getSunLatLong(this.panchangObj['date']['astroDate']);
    this.panchangObj["moonLatLong"] = this.getMoonLatLong(this.panchangObj['date']['astroDate']);
    this.panchangObj['sunRiseAstotimeObj'] = this.getAstroDate(this.panchangObj['sunRiseSet']['rise']['date']);
    this.panchangObj["tithiObj"] = this.getEntityOcuurencesTillDateEnd(this.getTithi,[this.panchangObj["date"], this.panchangObj['sunLatLong']['elon'], this.panchangObj['moonLatLong']['elon'], this.panchangObj["relativeMotionOffsets"].slice(1)], this.panchangObj["date"]["dateWith24Hours"], 'tithi');
    this.panchangObj["nakshatraObj"] = this.getEntityOcuurencesTillDateEnd(this.getNakshatra,[this.panchangObj["date"], this.panchangObj["relativeMotionOffsets"]], this.panchangObj["date"]["dateWith24Hours"], 'naksatra');
    this.panchangObj["yogaObj"] = this.getEntityOcuurencesTillDateEnd(this.getYoga,[this.panchangObj["date"], this.panchangObj["relativeMotionOffsets"].slice(1)], this.panchangObj["date"]["dateWith24Hours"], 'yoga');
    this.panchangObj["karanaObj"] = this.getEntityOcuurencesTillDateEnd(this.getKarana,[this.panchangObj["date"], this.panchangObj['sunLatLong']['elon'], this.panchangObj['moonLatLong']['elon'], this.panchangObj["relativeMotionOffsets"].slice(1)], this.panchangObj["date"]["dateWith24Hours"], 'karna');
    this.panchangObj["dayDuration"] = this.getDayDuration(this.panchangObj['sunRiseSet']['rise']['date'], this.panchangObj['sunRiseSet']['set']['date']);
    this.panchangObj["rashiObj"] = { 'moon': this.getRashi(AstroEngine.Body.Moon, this.panchangObj['date']['dateObj'], this.panchangObj['date']['astroDate']), 'sun': this.getRashi(AstroEngine.Body.Sun, this.panchangObj['date']['dateObj'], this.panchangObj['date']['astroDate']) };
    this.panchangObj["masaObj"] = this.getMasa(this.panchangObj["tithiObj"][0]['tithi'], this.panchangObj["date"]['dateObj'], this.panchangObj['date']['astroDate']);
    this.panchangObj["vedicTimeObj"] = this.getVedicTime(this.panchangObj['sunRiseSet']['rise']['date'], this.panchangObj["date"]['dateObj'], new Date(this.panchangObj["date"]['dateWithZeroHours']), this.panchangObj["observer"]);
    this.panchangObj["calSystemObj"] = this.getCalenderSystem(this.panchangObj["date"]['dateObj']);
   
    return this.panchangObj;
  }

  getEntityOcuurencesTillDateEnd(entityFunction: Function, args:Array<any>, dateEndTime: number, entity: string): Array<object> {
    let entityList:Array<object> = [];
    let callCompleted:boolean = false;
    while(!callCompleted){
     let obj: { [key: string]: any } = entityFunction.apply(this, args);
     entityList.push(obj);
     if(obj["endTimeStamp"] >= dateEndTime){
      callCompleted = true;
     }else{
      args[0] = this.getDateObj(new Date(obj["endTimeStamp"]+10000));
      if(entity === 'tithi' || entity === 'karna'){
        args[1] = this.getSunLatLong(args[0]['astroDate'])['elon'];
        args[2] = this.getMoonLatLong(args[0]['astroDate'])['elon'];
      }
     }
    }
    return entityList;
  }

  getCalenderSystem(date: Date): { [key: string]: any } {
    const year: number = date.getFullYear();
    const isLeapYear: boolean = ((year % 4 === 0) && (year % 100 != 0)) || (year % 400 === 0);
    let startDate: Date = isLeapYear ? new Date(year, 2, 21) : new Date(year, 2, 22);
    let calenderSystem: { [key: string]: any } = { 'vikramSamvat': 0, 'sakaSamvat': 0 };
    if (date >= startDate) {
      calenderSystem['vikramSamvat'] = year + 57;
      calenderSystem['sakaSamvat'] = year - 78;
    } else {
      calenderSystem['vikramSamvat'] = year + 56;
      calenderSystem['sakaSamvat'] = year - 79;
    }
    return calenderSystem;
  }


  getDayDuration(sunRiseTime: Date, sunSetTime: Date): number {
    let diff: number = sunSetTime.getTime() - sunRiseTime.getTime();
    return Number((((diff / 1000) / 60) / 60).toFixed(2));
  }


  getMasa(tithi: number, date: Date, astroDate: AstroEngine.AstroTime): { [key: string]: any } {
    let masaObj: { [key: string]: any } = {};
    let lastNewMoon: AstroEngine.AstroTime | null = AstroEngine.SearchMoonPhase(0, date, -(tithi + 2));
    let nextNewMoon: AstroEngine.AstroTime | null = AstroEngine.SearchMoonPhase(0, date, (30 - tithi) + 2);
    if (lastNewMoon && nextNewMoon) {
      let currentLunarMonth: number = this.getRashi(AstroEngine.Body.Moon, lastNewMoon['date'], lastNewMoon);
      let nextLunarMonth: number = this.getRashi(AstroEngine.Body.Moon, lastNewMoon['date'], nextNewMoon);
      masaObj['isLeapMonth'] = currentLunarMonth === nextLunarMonth;
      masaObj['masa'] = currentLunarMonth + 1;
      masaObj['masa'] = masaObj['masa'] > 12 ? (masaObj['masa'] % 12) : masaObj['masa'];
      masaObj['ritu'] = Math.ceil(masaObj['masa']/2);
      masaObj['ayana'] = this.getAyana(date);
    }
    return masaObj;
  }

  getAyana(date: Date): number{
    let astroSeasons = AstroEngine.Seasons(date.getFullYear());
    if(date.getTime() >= astroSeasons['jun_solstice']['date'].getTime()){
      if(date.getTime() >= astroSeasons['dec_solstice']['date'].getTime()){
        return 1;
      }else{
        return 2;
      }
    }else{
      return 1;
    }
  }




  getRashi(planet: AstroEngine.Body, date: Date, astroDate: AstroEngine.AstroTime): number {
    let degree: number = this.getPlanetLatLong(planet, astroDate)['elon'];
    const aayamsha = this.getAayamsha(date);
    const nirayana = (degree - aayamsha) % 360;
    const rashi = Math.ceil(nirayana / 30);
    return rashi;
  }

  getVedicTime(sunRiseTime: Date, date: Date, dateWithZeroHour: Date, observer: AstroEngine.Observer): { [key: string]: any } {
    let vedicTime: { [key: string]: any } = {};
    let dt: number = date.getTime() - sunRiseTime.getTime();
    if (dt < 0) {
      let predt = new Date(dateWithZeroHour.getTime());
      predt.setDate(predt.getDate() - 1);
      vedicTime['previousSunRise'] = this.getSunRiseSet(observer, predt);
      dt = date.getTime() - vedicTime['previousSunRise']['rise']['date'].getTime();
    }
    /* Note: 1 ghati = 24 min, 1 pal = 24 sec, 2.5 vipal = 1 sec */
    const min = dt / 60000;
    const ghati = min / 24;
    const remainingMinute = min - 24 * Math.floor(ghati);
    const pal = (remainingMinute * 60) / 24;
    const remainingPal = (pal) - Math.floor(pal);
    const vipal = (remainingPal * 24) * 2.5;
    vedicTime['vedicTime'] = Math.floor(ghati) + ':' + Math.floor(pal) + ':' + Math.floor(vipal);
    return vedicTime;
  }

  getTithi(dateObj: { [key: string]: any }, currentSunLong: number, currentMoonLong: number, offsets: Array<number>): { [key: string]: any } {
    let tithiObj: { [key: string]: any } = {};
    tithiObj['substituionValue'] = (currentMoonLong - currentSunLong);
    tithiObj['phase'] = tithiObj['substituionValue'] < 0 ? (360 + tithiObj['substituionValue']) : tithiObj['substituionValue'];
    tithiObj['tithi'] = Math.ceil(tithiObj['phase'] / 12);
    tithiObj['degreesLeft'] = (tithiObj['tithi'] * 12) - tithiObj['phase'];  /* <-- degree in radian */

    let relativeMotion: Array<number> = offsets.map((t) => {
      let moonRelativeSubstitution: number = this.getMoonLatLong(dateObj['astroDate'].AddDays(t))['elon'] - this.getMoonLatLong(dateObj['astroDate'])['elon'];
      let sunRelativeSubstitution: number = this.getSunLatLong(dateObj['astroDate'].AddDays(t))['elon'] - this.getSunLatLong(dateObj['astroDate'])['elon'];
      moonRelativeSubstitution = moonRelativeSubstitution < 0 ? (moonRelativeSubstitution + 360) : moonRelativeSubstitution;
      sunRelativeSubstitution = sunRelativeSubstitution < 0 ? (sunRelativeSubstitution + 360) : sunRelativeSubstitution;
      let relativeSubstitution: number = moonRelativeSubstitution - sunRelativeSubstitution;
      return relativeSubstitution < 0 ? (relativeSubstitution + 360) : relativeSubstitution;
    });

    let approxEnd: number = this.inverseLagrange(offsets, relativeMotion, tithiObj['degreesLeft'])*24; /* <-- radian to hour */
    tithiObj['tithiEnd'] = new Date(dateObj['timeStamp'] + this.convertHoursToMilliseconds(approxEnd)['millisec']);

    /* check for skipped tithi -- not validated */
    let nextPhase: number = this.getMoonLatLong(dateObj['astroDate'].AddDays(1))['elon'] - this.getSunLatLong(dateObj['astroDate'].AddDays(1))['elon'];
    tithiObj['substituionValueSkipCheck'] = nextPhase;
    nextPhase = nextPhase < 0 ? (360 + nextPhase) : nextPhase;
    let nextTithi = (Math.ceil(nextPhase / 12) - tithiObj['tithi']);
    nextTithi = nextTithi < 0 ? (nextTithi + 30) : nextTithi;
    let isSkipped: boolean = (nextTithi % 30) > 1;
    if (isSkipped) {
      tithiObj['tithiSkipped'] = true;
      tithiObj['phase'] = nextPhase;
      tithiObj['tithi'] = tithiObj['tithi'] + 1 % 30;
      tithiObj['degreesLeft'] = (tithiObj['tithi'] * 12) - tithiObj['phase'];
      approxEnd = this.inverseLagrange(offsets, relativeMotion, tithiObj['degreesLeft']) * 24;
      tithiObj['tithiEnd'] = new Date(dateObj['timeStamp'] + this.convertHoursToMilliseconds(approxEnd)['millisec']);
    }
    
    tithiObj['paksha'] = tithiObj['tithi'] > 15 ? 2 : 1;
    tithiObj['endTimeStamp'] = tithiObj['tithiEnd'].getTime();
    return tithiObj;
  }


  getNakshatra(dateObj: { [key: string]: any }, offsets: Array<number>): { [key: string]: any } {
    let nakshatraObj: { [key: string]: any } = {};
    let relativeLongitudes: Array<number> = offsets.map((t) => {
      let moonRelativeSubstitution: number = this.getMoonLatLong(dateObj['astroDate'].AddDays(t))['elon'] - this.getAayamsha(dateObj['dateObj']);
      moonRelativeSubstitution = moonRelativeSubstitution < 0 ? (moonRelativeSubstitution + 360) : moonRelativeSubstitution;
      return moonRelativeSubstitution;
    });

    nakshatraObj['nakshatra'] = Math.ceil(relativeLongitudes[0] * 27 / 360);
    nakshatraObj['nakshatraCharana'] = Math.ceil(((relativeLongitudes[0] - Math.floor(relativeLongitudes[0]))*800) / 200);
    relativeLongitudes = this.unwrapAngles(relativeLongitudes);
    let approxEnd: number = this.inverseLagrange(offsets, relativeLongitudes, nakshatraObj['nakshatra'] * 360 / 27) * 24;
    nakshatraObj['nakshatraEndTime'] = new Date(dateObj['timeStamp'] + this.convertHoursToMilliseconds(approxEnd)['millisec']);

    let nextNakshatra: number = Math.ceil(relativeLongitudes[relativeLongitudes.length - 1] * 27 / 360);
    nakshatraObj['substituionValueSkipCheck'] = nextNakshatra;
    nextNakshatra = nextNakshatra < 0 ? (nextNakshatra + 27) : nextNakshatra;
    let isSkipped: boolean = (nextNakshatra - nakshatraObj['nakshatra']) % 27 > 1;
    if (isSkipped) {
      nakshatraObj['nakshatraSkipped'] = true;
      nakshatraObj['nakshatra'] = nakshatraObj['nakshatra'] + 1;
      approxEnd = this.inverseLagrange(offsets, relativeLongitudes, nakshatraObj['nakshatra'] * 360 / 27) * 24;
      nakshatraObj['nakshatraEndTime'] = new Date(dateObj['timeStamp'] + this.convertHoursToMilliseconds(approxEnd)['millisec']);
    }
    nakshatraObj['endTimeStamp'] = nakshatraObj['nakshatraEndTime'].getTime();
    return nakshatraObj;
  }

  getKarana(dateObj: { [key: string]: any }, currentSunLong: number, currentMoonLong: number, offsets: Array<number>): { [key: string]: any } {
    let karanaObj: { [key: string]: any } = {};
    karanaObj['substituionValue'] = (currentMoonLong - currentSunLong);
    karanaObj['phase'] = karanaObj['substituionValue'] < 0 ? (360 + karanaObj['substituionValue']) : karanaObj['substituionValue'];
    karanaObj['karana'] = Math.ceil(karanaObj['phase'] / 6);
    karanaObj['degreesLeft'] = (karanaObj['karana'] * 6) - karanaObj['phase'];
    let relativeMotion: Array<number> = offsets.map((t) => {
      let moonRelativeSubstitution: number = this.getMoonLatLong(dateObj['astroDate'].AddDays(t))['elon'] - this.getMoonLatLong(dateObj['astroDate'])['elon'];
      let sunRelativeSubstitution: number = this.getSunLatLong(dateObj['astroDate'].AddDays(t))['elon'] - this.getSunLatLong(dateObj['astroDate'])['elon'];
      moonRelativeSubstitution = moonRelativeSubstitution < 0 ? (moonRelativeSubstitution + 360) : moonRelativeSubstitution;
      sunRelativeSubstitution = sunRelativeSubstitution < 0 ? (sunRelativeSubstitution + 360) : sunRelativeSubstitution;
      let relativeSubstitution: number = moonRelativeSubstitution - sunRelativeSubstitution;
      return relativeSubstitution < 0 ? (relativeSubstitution + 360) : relativeSubstitution;
    });

    let approxEnd: number = this.inverseLagrange(offsets, relativeMotion, karanaObj['degreesLeft']) * 24; /* <-- radian to hour */
    karanaObj['karanaEndTime'] = new Date(dateObj['timeStamp'] + this.convertHoursToMilliseconds(approxEnd)['millisec']);
    karanaObj['endTimeStamp'] = karanaObj['karanaEndTime'].getTime();
    return karanaObj;
  }



  getYoga(dateObj: { [key: string]: any }, offsets: Array<number>): { [key: string]: any } {
    let yogaObj: { [key: string]: any } = {};
    let moonLongitude: number = (this.getMoonLatLong(dateObj['astroDate'])['elon'] - this.getAayamsha(dateObj['dateObj'])) % 360
    let sunLongitude: number = (this.getSunLatLong(dateObj['astroDate'])['elon'] - this.getAayamsha(dateObj['dateObj'])) % 360
    let total: number = (moonLongitude + sunLongitude) % 360;
    yogaObj['yog'] = Math.ceil(total * 27 / 360);
    yogaObj['degreesLeft'] = yogaObj['yog'] * (360 / 27) - total;
    let relativeLongitudes: Array<number> = offsets.map((t) => {
      let moonRelativeSubstitution: number = this.getMoonLatLong(dateObj['astroDate'].AddDays(t))['elon'] - this.getMoonLatLong(dateObj['astroDate'])['elon'];
      let sunRelativeSubstitution: number = this.getSunLatLong(dateObj['astroDate'].AddDays(t))['elon'] - this.getSunLatLong(dateObj['astroDate'])['elon'];
      moonRelativeSubstitution = moonRelativeSubstitution < 0 ? (moonRelativeSubstitution + 360) : moonRelativeSubstitution;
      sunRelativeSubstitution = sunRelativeSubstitution < 0 ? (sunRelativeSubstitution + 360) : sunRelativeSubstitution;
      let relativeSubstitution: number = moonRelativeSubstitution + sunRelativeSubstitution;
      return relativeSubstitution;
    });
    let approxEnd: number = this.inverseLagrange(offsets, relativeLongitudes, yogaObj['degreesLeft']) * 24;
    yogaObj['yogaEndTime'] = new Date(dateObj['dateObj'].getTime() + this.convertHoursToMilliseconds(approxEnd)['millisec']);

    let sunRiseWithOneDay: AstroEngine.AstroTime = dateObj['astroDate'].AddDays(1);
    let nextMoonLongitude: number = (this.getMoonLatLong(sunRiseWithOneDay)['elon'] - this.getAayamsha(sunRiseWithOneDay['date'])) % 360
    let nextSunLongitude: number = (this.getSunLatLong(sunRiseWithOneDay)['elon'] - this.getAayamsha(sunRiseWithOneDay['date'])) % 360
    let nextTotal = (nextMoonLongitude + nextSunLongitude) % 360;
    yogaObj['substituionValueSkipCheck'] = Math.ceil(nextTotal * 27 / 360);
    let isSkipped: boolean = (yogaObj['substituionValueSkipCheck'] - yogaObj['yog']) % 27 > 1;
    if (isSkipped) {
      yogaObj['yogaSkipped'] = true;
      yogaObj['yog'] = yogaObj['yog'] + 1;
      yogaObj['degreesLeft'] = yogaObj['yog'] * (360 / 27) - total;
      approxEnd = this.inverseLagrange(offsets, relativeLongitudes, yogaObj['degreesLeft']) * 24;
      yogaObj['yogaEndTime'] = new Date(dateObj['dateObj'].getTime() + this.convertHoursToMilliseconds(approxEnd)['millisec']);
    }

    yogaObj['endTimeStamp'] = yogaObj['yogaEndTime'].getTime();
    return yogaObj;
  }


  unwrapAngles(degreeAngles: Array<number>): Array<number> {
    for (let i = 1; i < degreeAngles.length; i++) {
      if (degreeAngles[i] < degreeAngles[i - 1]) {
        degreeAngles[i] += 360;
      }
    }
    return degreeAngles;
  }


  getAayamsha(date: Date, correctionIndex: number = 0): number {
    const correctionSystem = [{ '0': 'lahiri', 'startYear': 285, 'movement': 50.2791 }, { '0': 'lahiri', 'startYear': 291, 'movement': 50.2388475 }, { '2': 'raman', 'startYear': 297, 'movement': 50.33 }];
    const year = date.getFullYear() - correctionSystem[correctionIndex]['startYear'];
    return ((year * correctionSystem[correctionIndex]['movement']) / 60) / 60;
  }

  convertHoursToMilliseconds(hours: number): { millisec: number, HrMinSec: Array<number> } {
    hours = Number(hours.toFixed(3));
    let h: number = Math.floor(hours);
    let mins: number = (hours - h) * 60;
    let m: number = Math.floor(mins);
    let s: number = (mins - m) * 60;
    return { millisec: (h * 60 * 60 * 1000) + (m * 60 * 1000) + (s * 1000), HrMinSec: [h, m, s] };
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


  getVaara(date: Date, sunRiseDate: Date): { [key: string]: any } {
    let day = date.getDay() + 1;
    if (date.getTime() < sunRiseDate.getTime()) {
      day = day - 1;
    }
    return {day};
  }

  getSunLatLong(date: AstroEngine.AstroTime): { [key: string]: any } {
    return AstroEngine.Ecliptic(AstroEngine.GeoVector(AstroEngine.Body.Sun, date, false));
  }

  getMoonLatLong(date: AstroEngine.AstroTime): { [key: string]: any } {
    return AstroEngine.Ecliptic(AstroEngine.GeoVector(AstroEngine.Body.Moon, date, false));
  }

  getPlanetLatLong(planet: AstroEngine.Body, date: AstroEngine.AstroTime): { [key: string]: any } {
    return AstroEngine.Ecliptic(AstroEngine.GeoVector(planet, date, false));
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

  getDateObj(date: Date, fullDate: boolean = false): object {
    return fullDate ? {
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
      dateWithZeroHours: new Date(date).setHours(0, 0, 0, 0),
      dateWith24Hours: new Date(date).setHours(23,59,59,999),
      todaysDate: date.toLocaleDateString() === new Date().toLocaleDateString()
    }: {
       dateObj: date,
       timeStamp: date.getTime(),
       timezoneOffset: date.getTimezoneOffset(),
       astroDate: this.getAstroDate(date)
    }
  }

  async getAndAssignLocationObj(assignableObjRef: { [key: string]: any }) {
    if (!sessionStorage.getItem('locationObject')) {
      const loacationResponse:any = await firstValueFrom(this._http.get("http://ip-api.com/json"));
      // .pipe(switchMap(async (response: any) => {
        // debugger
        // const eleVationResponse: any = await firstValueFrom(this._http.get("https://api.open-elevation.com/api/v1/lookup?locations=" + response['lat'] + "," + response['lon']));
        // response['elevation'] = eleVationResponse['results'][0]['elevation'] / 1000;
        // return response;
      // })));

      // const eleVationResponse: any = await firstValueFrom(this._http.get("https://api.open-elevation.com/api/v1/lookup?locations=" + loacationResponse['lat'] + "," + loacationResponse['lon']));
      // loacationResponse['elevation'] =  eleVationResponse['results'] ? ( eleVationResponse['results'][0]['elevation'] / 1000) : 0.002;
      loacationResponse['elevation'] = 0.02
     
      sessionStorage.setItem('locationObject', JSON.stringify(loacationResponse));
      assignableObjRef["locationObj"] = loacationResponse;
    } else {
      assignableObjRef["locationObj"] = JSON.parse(String(sessionStorage.getItem('locationObject')));
    }
  }

}
