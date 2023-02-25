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
    this.panchangObj["sunRiseSet"] = this.getSunRiseSet(this.panchangObj["observer"], this.panchangObj["date"]["dateWithZeroHours"]);
    this.panchangObj["moonRiseSet"] = this.getMoonRiseSet(this.panchangObj["observer"], this.panchangObj['sunRiseSet']['rise']['date'])
    this.panchangObj["vedicDayObj"] = this.getVaara(this.panchangObj['date']['dateObj'], this.panchangObj['sunRiseSet']['rise']['date']);
    this.panchangObj["dayDuration"] = this.getDayDuration(this.panchangObj['sunRiseSet'], this.panchangObj["date"]['dateObj'], this.panchangObj["date"]['dateWithZeroHours'], this.panchangObj["observer"]);
    this.panchangObj["vedicTimeObj"] = this.getVedicTime(this.panchangObj['sunRiseSet']['rise']['date'], this.panchangObj["date"]['dateObj'], this.panchangObj["date"]['dateWithZeroHours'], this.panchangObj["observer"]);
    this.panchangObj["sunLatLong"] = this.getSunLatLong(this.panchangObj['date']['astroDate']);
    this.panchangObj["moonLatLong"] = this.getMoonLatLong(this.panchangObj['date']['astroDate']);
    this.panchangObj["tithiObj"] = this.getEntityOcuurencesTillDateEnd(this.getTithi, [this.panchangObj["date"], this.panchangObj['sunLatLong']['elon'], this.panchangObj['moonLatLong']['elon'], this.panchangObj["relativeMotionOffsets"].slice(1)], this.panchangObj["date"]["dateWith24Hours"], 'tithi');
    this.panchangObj["nakshatraObj"] = this.getEntityOcuurencesTillDateEnd(this.getNakshatra, [this.panchangObj["date"], this.panchangObj["relativeMotionOffsets"]], this.panchangObj["date"]["dateWith24Hours"], 'naksatra');
    this.panchangObj["yogaObj"] = this.getEntityOcuurencesTillDateEnd(this.getYoga, [this.panchangObj["date"], this.panchangObj["relativeMotionOffsets"].slice(1)], this.panchangObj["date"]["dateWith24Hours"], 'yoga');
    this.panchangObj["karanaObj"] = this.getEntityOcuurencesTillDateEnd(this.getKarana, [this.panchangObj["date"], this.panchangObj['sunLatLong']['elon'], this.panchangObj['moonLatLong']['elon'], this.panchangObj["relativeMotionOffsets"].slice(1)], this.panchangObj["date"]["dateWith24Hours"], 'karna');
    this.panchangObj["rashiObj"] = { 'moon': this.getEntityOcuurencesTillDateEnd(this.getRashi, [this.panchangObj['date'], AstroEngine.Body.Moon, this.panchangObj["relativeMotionOffsets"]], this.panchangObj["date"]["dateWith24Hours"], 'rashi'), 'sun': this.getEntityOcuurencesTillDateEnd(this.getRashi, [this.panchangObj['date'], AstroEngine.Body.Sun, this.panchangObj["relativeMotionOffsets"]], this.panchangObj["date"]["dateWith24Hours"], 'rashi') };
    this.panchangObj["masaObj"] = this.getMasa(this.panchangObj["tithiObj"][0]['tithi'], this.panchangObj["date"]);
    this.panchangObj["calSystemObj"] = this.getCalenderSystem(this.panchangObj["date"]['dateObj']);
    return this.panchangObj;
  }

  /* tested */
  getEntityOcuurencesTillDateEnd(entityFunction: Function, args: Array<any>, dateEndTime: number, entity: string): Array<object> {
    let entityList: Array<object> = [];
    let callCompleted: boolean = false;
    while (!callCompleted) {
      let obj: { [key: string]: any } = entityFunction.apply(this, args);
      entityList.push(obj);
      if (obj["endTimeStamp"] >= dateEndTime || entityList.length > 5) {
        callCompleted = true;
      } else {
        args[0] = this.getDateObj(new Date(obj["endTimeStamp"] + 1000000));
        if (entity === 'tithi' || entity === 'karna') {
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

  /* tested */
  getDayDuration(sunRiseSetTime: { [key: string]: any }, date: Date, dateWithZeroHr: Date, observer: AstroEngine.Observer): { [key: string]: any } {

    let timeDuration: number = date.getTime() - sunRiseSetTime['rise']['date'].getTime();
    let currentSunRiseSet: { [key: string]: any }, nextSunRiseSet: { [key: string]: any };
    if (timeDuration < 0) {
      let previousDate = new Date(dateWithZeroHr.getTime());
      previousDate.setDate(previousDate.getDate() - 1);
      currentSunRiseSet = this.getSunRiseSet(observer, previousDate);
      nextSunRiseSet = sunRiseSetTime;
    } else {
      let nextDate = new Date(dateWithZeroHr.getTime());
      nextDate.setDate(nextDate.getDate() + 1);
      currentSunRiseSet = sunRiseSetTime;
      nextSunRiseSet = this.getSunRiseSet(observer, nextDate);
    }

    const totalDuration: number = nextSunRiseSet['rise']['date'].getTime() - currentSunRiseSet['rise']['date'].getTime();
    const dayDuration: number = currentSunRiseSet['set']['date'].getTime() - currentSunRiseSet['rise']['date'].getTime();
    timeDuration = date.getTime() - currentSunRiseSet['rise']['date'].getTime();
    const nightDuration: number = totalDuration - dayDuration;
    let pahara: number;

    if (timeDuration - dayDuration) {
      pahara = 4 + Math.ceil((timeDuration - dayDuration) / (nightDuration / 4));
    } else {
      pahara = Math.ceil((timeDuration) / (dayDuration / 4));
    }

    let durationObj: { [key: string]: any } = {
      'dayDurationInMillSec': dayDuration,
      'nightDurationInMilliSec': nightDuration,
      'dayDuration': this.convertHoursToMilliseconds(Number((((dayDuration / 1000) / 60) / 60)))['HrMinSec'],
      'nightDuration': this.convertHoursToMilliseconds(Number((((nightDuration / 1000) / 60) / 60)))['HrMinSec'],
      'pahara': pahara
    }
    durationObj['dayDurationString'] = durationObj['dayDuration'][0] + ' Hrs, ' + durationObj['dayDuration'][1] + ' Min, ' + durationObj['dayDuration'][2] + ' Sec'
    durationObj['nightDurationString'] = durationObj['nightDuration'][0] + ' Hrs, ' + durationObj['nightDuration'][1] + ' Min, ' + durationObj['nightDuration'][2] + ' Sec'
    return durationObj;
  }


  getMasa(tithi: number, dateObj: { [key: string]: any }): { [key: string]: any } {
    let masaObj: { [key: string]: any } = {};
    let lastNewMoon: AstroEngine.AstroTime | null = AstroEngine.SearchMoonPhase(0, dateObj["dateObj"], -(tithi + 2));
    let nextNewMoon: AstroEngine.AstroTime | null = AstroEngine.SearchMoonPhase(0, dateObj["dateObj"], (30 - tithi) + 2);
    let lastFullMoon: AstroEngine.AstroTime | null = AstroEngine.SearchMoonPhase(180, dateObj["dateObj"], -(tithi + 16));
    let nextFullMoon: AstroEngine.AstroTime | null = AstroEngine.SearchMoonPhase(180, dateObj["dateObj"], (30 - tithi) + 16);
    if (lastNewMoon && nextNewMoon) {
      let currentLunarMonth: number = Number(this.getRashi(this.getDateObj(lastNewMoon['date']), AstroEngine.Body.Moon));
      let nextLunarMonth: number = Number(this.getRashi(this.getDateObj(nextNewMoon['date']), AstroEngine.Body.Moon));
      masaObj['isLeapMonth'] = currentLunarMonth === nextLunarMonth;
      masaObj['masa'] = currentLunarMonth + 1;
      masaObj['masa'] = masaObj['masa'] > 12 ? (masaObj['masa'] % 12) : masaObj['masa'];
      masaObj['ritu'] = Math.ceil(masaObj['masa'] / 2);
      masaObj['ayana'] = this.getAyana(dateObj["dateObj"]);
    }
    return masaObj;
  }

  getAyana(date: Date): number {
    let astroSeasons = AstroEngine.Seasons(date.getFullYear());
    if (date.getTime() >= astroSeasons['jun_solstice']['date'].getTime()) {
      if (date.getTime() >= astroSeasons['dec_solstice']['date'].getTime()) {
        return 1;
      } else {
        return 2;
      }
    } else {
      return 1;
    }
  }


  getRashi(dateObj: { [key: string]: any }, planet: AstroEngine.Body, offsets: Array<number> = []): { [key: string]: any } | number {
    let degree: number = this.getPlanetLatLong(planet, dateObj["astroDate"])['elon'];
    let nirayana = (degree - this.getAayamsha(dateObj["dateObj"]));
    nirayana = nirayana < 0 ? (nirayana + 360) : nirayana;
    const rashi = Math.ceil(nirayana / 30);

    if (offsets.length) {
      const relativeMotion: Array<number> = offsets.map((t: number) => {
        let releativeNiryana = this.getPlanetLatLong(planet, dateObj["astroDate"].AddDays(t))['elon'] - this.getAayamsha(dateObj["astroDate"].AddDays(t)['date'])
        releativeNiryana = releativeNiryana < 0 ? (releativeNiryana + 360) : releativeNiryana;
        return releativeNiryana;
      });
      const approxEnd = this.inverseLagrange(offsets, relativeMotion, rashi * 360 / 12) * 24;
      const rashiEndTime = new Date(dateObj['timeStamp'] + this.convertHoursToMilliseconds(approxEnd)['millisec'])
      return { rashi, rashiEndTime, endTimeStamp: rashiEndTime.getTime() };
    } else {
      return rashi;
    }
  }

  /* tested */
  getVedicTime(sunRiseTime: Date, date: Date, dateWithZeroHour: Date, observer: AstroEngine.Observer): { [key: string]: any } {
    let vedicTime: { [key: string]: any } = {};
    let timeDuration: number = date.getTime() - sunRiseTime.getTime();
    if (timeDuration < 0) {
      let predt = new Date(dateWithZeroHour.getTime());
      predt.setDate(predt.getDate() - 1);
      vedicTime['previousSunRise'] = this.getSunRiseSet(observer, predt);
      timeDuration = date.getTime() - vedicTime['previousSunRise']['rise']['date'].getTime();
    }

    // Note: 1 gegorian day = 60 ghati, 1 ghati = 24 min, 1 ghati = 60 kala, 1 kala = 60 vikala
    const ghati = timeDuration / 1440000;
    const kala = (ghati - Math.floor(ghati)) * 60;
    const vikala = (kala - Math.floor(kala)) * 60;
    vedicTime['vedicTime'] = Math.floor(ghati) + ' Ghati, ' + Math.floor(kala) + ' Kala, ' + Math.floor(vikala) + ' Vikala';
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

    let approxEnd: number = this.inverseLagrange(offsets, relativeMotion, tithiObj['degreesLeft']) * 24; /* <-- radian to hour */
    tithiObj['tithiEnd'] = new Date(dateObj['timeStamp'] + this.convertHoursToMilliseconds(approxEnd)['millisec']);
    tithiObj['tithiEndAstroDate'] = this.getAstroDate(tithiObj['tithiEnd']);
    /* check for skipped tithi -- not validated */
    let nextPhase: number = this.getMoonLatLong(tithiObj['tithiEndAstroDate'].AddDays(0.5))['elon'] - this.getSunLatLong(tithiObj['tithiEndAstroDate'].AddDays(0.5))['elon'];
    tithiObj['substituionValueSkipCheck'] = nextPhase;
    nextPhase = nextPhase < 0 ? (360 + nextPhase) : nextPhase;
    let nextTithi = (Math.ceil(nextPhase / 12) - tithiObj['tithi']);
    nextTithi = nextTithi < 0 ? (nextTithi + 30) : nextTithi;
    let isSkipped: boolean = (nextTithi % 30) > 1;
    if (isSkipped) {
      tithiObj['tithiSkipped'] = true;
      tithiObj['phase'] = nextPhase;
      tithiObj['tithi'] = tithiObj['tithi'] + 1 % 30;
      tithiObj['tithi'] = Math.ceil(tithiObj['phase'] / 12);
      tithiObj['degreesLeft'] = (tithiObj['tithi'] * 12) - tithiObj['phase'];
      approxEnd = this.inverseLagrange(offsets, relativeMotion, tithiObj['degreesLeft']) * 24;
      tithiObj['tithiEnd'] = new Date(dateObj['timeStamp'] + this.convertHoursToMilliseconds(approxEnd)['millisec']);
      tithiObj['tithiEndAstroDate'] = this.getAstroDate(tithiObj['tithiEnd']);
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
    nakshatraObj['nakshatraCharana'] = this.getNakshartraCharana(relativeLongitudes[0]);
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

  /* tested */
  getNakshartraCharana(longitude: number): number {
    let oneNakshatraDegreeSpan: number = (360 / 27);
    let oneCharanaDegreeSpan: number = (360 / 108);
    let nakshatra: number = Math.trunc(longitude / oneNakshatraDegreeSpan) + 1;
    let degreeLeft: number = ((nakshatra * oneNakshatraDegreeSpan) - longitude);
    let charana: number = Math.abs(Math.trunc((oneNakshatraDegreeSpan - degreeLeft) / oneCharanaDegreeSpan)) + 1;
    return charana;
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

  /* tested */
  vernalPointLongitudeChange(time1: AstroEngine.AstroTime, time2: AstroEngine.AstroTime): number {
    const vec2: AstroEngine.Vector = new AstroEngine.Vector(1, 0, 0, time2);
    const rot: AstroEngine.RotationMatrix = AstroEngine.CombineRotation(AstroEngine.Rotation_ECT_EQJ(time2), AstroEngine.Rotation_EQJ_ECT(time1));
    const vec1: AstroEngine.Vector = AstroEngine.RotateVector(rot, vec2);
    const sphere: AstroEngine.Spherical = AstroEngine.SphereFromVector(vec1);
    return (sphere.lon > 180) ? (360 - sphere.lon) : sphere.lon;
  }

  getAayamsha(date: Date, correctionIndex: number = 0): number {
    const correctionSystem: [{ [key: string]: any }] = [{ '0': 'lahiri', 'startYear': 285, 'movement': 50.2791, 'zeroAyanamsaVernalEquinoxDate': new Date("Sun Mar 22 0285 15:57:0 GMT") }];
    correctionIndex = correctionIndex > correctionSystem.length ? 0 : correctionIndex;
    return this.vernalPointLongitudeChange(this.getAstroDate(correctionSystem[correctionIndex]['zeroAyanamsaVernalEquinoxDate']), this.getAstroDate(date));
  }

  /* tested */
  convertHoursToMilliseconds(hours: number): { millisec: number, HrMinSec: Array<number> } {
    hours = Number(hours.toFixed(3));
    let h: number = Math.floor(hours);
    let mins: number = (hours - h) * 60;
    let m: number = Math.floor(mins);
    let s: number = (mins - m) * 60;
    return { millisec: (h * 60 * 60 * 1000) + (m * 60 * 1000) + (s * 1000), HrMinSec: [h, m, Math.floor(s)] };
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

  /* tested */
  getVaara(date: Date, sunRiseDate: Date): { [key: string]: any } {
    let day: number = date.getDay() + 1;
    if (date.getTime() < sunRiseDate.getTime()) {
      day = day - 1;
      day = day === 0 ? 7 : day;
    }
    return { day };
  }

  /* tested */
  getSunLatLong(date: AstroEngine.AstroTime): { [key: string]: any } {
    return AstroEngine.Ecliptic(AstroEngine.GeoVector(AstroEngine.Body.Sun, date, false));
  }

  /* tested */
  getMoonLatLong(date: AstroEngine.AstroTime): { [key: string]: any } {
    return AstroEngine.Ecliptic(AstroEngine.GeoVector(AstroEngine.Body.Moon, date, false));
  }

  /* tested */
  getPlanetLatLong(planet: AstroEngine.Body, date: AstroEngine.AstroTime): { [key: string]: any } {
    return AstroEngine.Ecliptic(AstroEngine.GeoVector(planet, date, false));
  }

  /* tested */
  getSunRiseSet(observer: AstroEngine.Observer, dateWithZeroHour: Date): object {
    const astroDate: AstroEngine.AstroTime = this.getAstroDate(dateWithZeroHour);
    const sunRiseSetObject: any = { rise: AstroEngine.SearchRiseSet(AstroEngine.Body.Sun, observer, +1, astroDate, 1), set: AstroEngine.SearchRiseSet(AstroEngine.Body.Sun, observer, -1, astroDate, 1) };
    sunRiseSetObject['riseString'] = sunRiseSetObject['rise'] ? sunRiseSetObject['rise']['date'].toLocaleTimeString([], { hour12: true }) : 'No sun rise';
    sunRiseSetObject['setString'] = sunRiseSetObject['set'] ? sunRiseSetObject['set']['date'].toLocaleTimeString([], { hour12: true }) : 'No sun rise';
    return sunRiseSetObject;
  }

  /* tested */
  getMoonRiseSet(observer: AstroEngine.Observer, sunRiseDate: Date): object {
    const moonRiseSetObject: any = { rise: AstroEngine.SearchRiseSet(AstroEngine.Body.Moon, observer, +1, sunRiseDate, 1), set: AstroEngine.SearchRiseSet(AstroEngine.Body.Moon, observer, -1, sunRiseDate, 1) };
    moonRiseSetObject['riseString'] = moonRiseSetObject['rise'] ? (moonRiseSetObject['rise']['date'].toLocaleTimeString([], moonRiseSetObject['rise']['date'].getDate() !== sunRiseDate.getDate() ? { hour12: true, day: 'numeric', month: 'short' } : { hour12: true }).replace(',', '')) : 'No moon rise';
    moonRiseSetObject['setString'] = moonRiseSetObject['set'] ? (moonRiseSetObject['set']['date'].toLocaleTimeString([], moonRiseSetObject['set']['date'].getDate() !== sunRiseDate.getDate() ? { hour12: true, day: 'numeric', month: 'short' } : { hour12: true }).replace(',', '')) : 'No moon set';
    return moonRiseSetObject;
  }

  /* tested */
  getAstroDate(date: Date): AstroEngine.AstroTime {
    return AstroEngine.MakeTime(date);
  }

  /* tested */
  getAstroObserver(lat: number, long: number, elevation: number): AstroEngine.Observer {
    return new AstroEngine.Observer(lat, long, elevation);
  }

  /* tested */
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
      dateWithZeroHours: new Date(new Date(date).setHours(0, 0, 0, 0)),
      dateWith24Hours: new Date(new Date(date).setHours(23, 59, 59, 999)),
      todaysDate: date.toLocaleDateString() === new Date().toLocaleDateString()
    } : {
      dateObj: date,
      timeStamp: date.getTime(),
      timezoneOffset: date.getTimezoneOffset(),
      astroDate: this.getAstroDate(date)
    }
  }

  async getAndAssignLocationObj(assignableObjRef: { [key: string]: any }) {
    if (!sessionStorage.getItem('locationObject')) {
      const loacationResponse: any = await firstValueFrom(this._http.get("http://ip-api.com/json"));
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
