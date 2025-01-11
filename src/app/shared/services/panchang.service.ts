import { Injectable } from '@angular/core';
import { PanchangMapService } from '@shared/services/panchangMap.service';
import * as AstroEngine from 'astronomy-engine';
@Injectable({
  providedIn: 'root'
})
export class PanchangService {
  private panchangObj: { [key: string]: any } = {};

  constructor(private _panchangMapService: PanchangMapService) { }

  getPanchang(date: Date, locationObj: { [key: string]: any }): object {
    this.panchangObj = {};
    this.panchangObj["locationObj"] = locationObj;
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
    this.panchangObj["mahuratam"] = this.getAllMahuratas(this.panchangObj["observer"]);
    this.panchangObj["vasa"] = this.getVasa(this.panchangObj["tithiObj"], this.panchangObj["vedicDayObj"]["day"]);
    // this.panchangObj["dishaShula"] = this.getDishaSulam(this.panchangObj["vedicDayObj"]["day"]);

    this.panchangObj = this._panchangMapService.mapPanchangObj(this.panchangObj);
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

  /* tested */
  getCalenderSystem(date: Date): { [key: string]: any } {
    let year = date.getFullYear();
    let indianCalanderStartMonth = new Date(date.getFullYear(), 2, 1);
    let fullMoonYearEndTime: AstroEngine.AstroTime | null = AstroEngine.SearchMoonPhase(180, indianCalanderStartMonth, 30);
    let newMoonYearEndTime: AstroEngine.AstroTime | null = fullMoonYearEndTime ? AstroEngine.SearchMoonPhase(0, fullMoonYearEndTime['date'], 16) : null;
    let calenderSystem: { [key: string]: any } = { 'vikramSamvat': 0, 'sakaSamvat': 0 };

    if (newMoonYearEndTime) {
      if (date.getTime() > newMoonYearEndTime['date'].getTime()) {
        calenderSystem['sakaSamvat'] = year - 78;
      } else {
        calenderSystem['sakaSamvat'] = year - 79;
      }
    }

    if (fullMoonYearEndTime) {
      if (date.getTime() > fullMoonYearEndTime['date'].getTime()) {
        calenderSystem['vikramSamvat'] = year + 57;
      } else {
        calenderSystem['vikramSamvat'] = year + 56;
      }
    }

    calenderSystem['vikramSamvatSara'] = ((calenderSystem['vikramSamvat'] + 9) % 60) + 1;
    calenderSystem['sakaSamvatSara'] = ((calenderSystem['sakaSamvat'] + 11) % 60) + 1;

    return calenderSystem;
  }

  /* tested */ //not working
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
    // const nightDuration: number = nextSunRiseSet['rise']['date'].getTime() - currentSunRiseSet['set']['date'].getTime();

    let pahara: number;

    if (timeDuration - dayDuration) {
      pahara = 4 + Math.ceil((timeDuration - dayDuration) / (nightDuration / 4));
    } else {
      pahara = Math.ceil((timeDuration) / (dayDuration / 4));
    }

    let durationObj: { [key: string]: any } = {
      'dayDurationInMilliSec': dayDuration,
      'nightDurationInMilliSec': nightDuration,
      'dayDuration': this.convertHoursToMilliseconds(Number((((dayDuration / 1000) / 60) / 60)))['HrMinSec'],
      'nightDuration': this.convertHoursToMilliseconds(Number((((nightDuration / 1000) / 60) / 60)))['HrMinSec'],
      'pahara': pahara,
      'nextDaySunRiseSetAstroObj': nextSunRiseSet,
      'currentDaySunRiseSetAstroObj': currentSunRiseSet
    }
    durationObj['dayDurationString'] = durationObj['dayDuration'][0] + ' Hrs, ' + durationObj['dayDuration'][1] + ' Min, ' + durationObj['dayDuration'][2] + ' Sec'
    durationObj['nightDurationString'] = durationObj['nightDuration'][0] + ' Hrs, ' + durationObj['nightDuration'][1] + ' Min, ' + durationObj['nightDuration'][2] + ' Sec'
    return durationObj;
  }


  getMasa(tithi: number, dateObj: { [key: string]: any }): { [key: string]: any } {
    let masaObj: { [key: string]: any } = {};
    let lastFullMoon: AstroEngine.AstroTime | null = AstroEngine.SearchMoonPhase(180, dateObj["dateObj"], -(tithi + 16));
    // let nextFullMoon: AstroEngine.AstroTime | null = AstroEngine.SearchMoonPhase(180, dateObj["dateObj"], (30 - tithi) + 16);
    let lastNewMoon: AstroEngine.AstroTime | null = AstroEngine.SearchMoonPhase(0, dateObj["dateObj"], -(tithi + 2));
    let nextNewMoon: AstroEngine.AstroTime | null = AstroEngine.SearchMoonPhase(0, dateObj["dateObj"], (30 - tithi) + 2);

    if (lastNewMoon && nextNewMoon) {
      let currentLunarMonth: number = Number(this.getRashi(this.getDateObj(lastNewMoon['date']), AstroEngine.Body.Moon));
      let nextLunarMonth: number = Number(this.getRashi(this.getDateObj(nextNewMoon['date']), AstroEngine.Body.Moon));
      masaObj['isAmantaLeapMonth'] = currentLunarMonth === nextLunarMonth;
      masaObj['amantaMasa'] = currentLunarMonth + 1;
      masaObj['amantaMasa'] = masaObj['amantaMasa'] > 12 ? (masaObj['amantaMasa'] % 12) : masaObj['amantaMasa'];
      masaObj['amantaRitu'] = Math.ceil(masaObj['amantaMasa'] / 2);
    }

    if (lastFullMoon && lastNewMoon) {
      if (lastNewMoon['date'].getTime() < lastFullMoon['date'].getTime() && dateObj["dateObj"].getTime() > lastFullMoon['date'].getTime()) {
        masaObj['purnimantaMasa'] = masaObj['amantaMasa'] + 1;
        masaObj['purnimantaMasa'] = masaObj['purnimantaMasa'] > 12 ? (masaObj['purnimantaMasa'] % 12) : masaObj['purnimantaMasa'];
      } else {
        masaObj['purnimantaMasa'] = masaObj['amantaMasa'];
      }
      masaObj['purnimantaRitu'] = Math.ceil(masaObj['purnimantaMasa'] / 2);
    }

    masaObj['siderealRituObj'] = this.getRituOfYear(dateObj["dateObj"].getFullYear(), dateObj["dateObj"]);
    masaObj['siderealRitu'] = masaObj['siderealRituObj']['ritu'];
    masaObj['ayana'] = this.getAyana(dateObj["dateObj"]);
    return masaObj;
  }

  /* tested */
  getRituOfYear(year: number, date?: Date): { [key: string]: any } {
    let rituTargetLon: { [key: string]: number } = { '2': 330, '4': 30, '6': 90, '8': 150, '10': 210, '12': 270 }
    let getRituTime = (targetLon: number, month: number, day: number) => {
      let startDate: Date = new Date(Date.UTC(year, month - 1, day));
      let time: AstroEngine.AstroTime | null = AstroEngine.SearchSunLongitude(targetLon, startDate, 27);
      return time;
    }

    let rituStartTimeList: Array<AstroEngine.AstroTime | null> = [getRituTime(rituTargetLon[2], 2, 1), getRituTime(rituTargetLon[4], 4, 1), getRituTime(rituTargetLon[6], 6, 1), getRituTime(rituTargetLon[8], 8, 1), getRituTime(rituTargetLon[10], 10, 1), getRituTime(rituTargetLon[12], 12, 1)];
    if (date) {
      let ritu: number = 6;
      rituStartTimeList.forEach((astroTime: AstroEngine.AstroTime | null, index: number) => {
        if (astroTime && date.getTime() >= astroTime['date'].getTime()) {
          ritu = index + 1;
        }
      });
      return { ritu, yearsRituTimeList: rituStartTimeList };
    } else {
      return { ritu: null, yearsRituTimeList: rituStartTimeList };
    }
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
    tithiObj['degreesLeft'] = (tithiObj['tithi'] * 12) - tithiObj['phase'];  /* degree in radian */

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
    nakshatraObj['nakshatraCharana'] = this.getNakshartraCharana(relativeLongitudes[0], offsets, relativeLongitudes, dateObj['dateObj']);
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
  getNakshartraCharana(longitude: number, offsets?: Array<number>, relativeLongitudes?: Array<number>, date?: Date): { [key: string]: any } {
    let oneNakshatraDegreeSpan: number = (360 / 27);
    let oneCharanaDegreeSpan: number = (360 / 108);
    let nakshatra: number = Math.trunc(longitude / oneNakshatraDegreeSpan) + 1;
    let degreeLeft: number = ((nakshatra * oneNakshatraDegreeSpan) - longitude);
    let charana: number = Math.abs(Math.trunc((oneNakshatraDegreeSpan - degreeLeft) / oneCharanaDegreeSpan)) + 1;


    let charanaTimes: Array<Date> = [];
    if (offsets && relativeLongitudes && date) {
      let approxStart: number = this.inverseLagrange(offsets, relativeLongitudes, nakshatra) * 24;
      let nakshatraStartTime = new Date(date.getTime() + this.convertHoursToMilliseconds(approxStart)['millisec']);
      console.log('....', nakshatraStartTime);

      let charanaCovered = (nakshatra * oneNakshatraDegreeSpan);
      let naksatraCharana = [charanaCovered, charanaCovered - oneCharanaDegreeSpan, charanaCovered - (oneCharanaDegreeSpan * 2), charanaCovered - (oneCharanaDegreeSpan * 3), charanaCovered - (oneCharanaDegreeSpan * 4)]
      charanaTimes = naksatraCharana.map((element) => {
        let approxEnd: number = this.inverseLagrange(offsets, relativeLongitudes, element) * 24;
        return new Date(date.getTime() + this.convertHoursToMilliseconds(approxEnd)['millisec']);
      });
      console.log('....',);
    }

    return { charana, charanaTimes };
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

  /* tested */
  getAayamsha(date: Date, correctionIndex: number = 0): number {
 
    const correctionSystem: { [key: string]: any } = {
      0: {
        system: 'lahiri',
        referenceYear: 285,
        referenceAyanamsha: 23.85675,
        tropicalYear: 365.2425,
        precessionRate: 50.290966,
        approxAyanamsaVernalEquinoxDate: new Date(285, 2, 21),
        computationRequired: true
      },
      1:{
        system: 'krishnamurti',
        referenceYear: 291,
        referenceAyanamsha: 23.85724,
        tropicalYear: 365.2425,
        precessionRate: 50.290966,
        approxAyanamsaVernalEquinoxDate: new Date(291, 2, 21),
        computationRequired: true
      },
      2:{
        system: 'raman',
        referenceYear: 397,
        referenceAyanamsha: 22.37076,
        tropicalYear: 365.2425,
        precessionRate: 50.290966,
        approxAyanamsaVernalEquinoxDate: new Date(397, 2, 21),
        computationRequired: true,
        
      },
      3:{
        system: 'fagan-bradley',
        referenceYear: 221,
        referenceAyanamsha: 24.04224,
        tropicalYear: 365.2425,
        precessionRate: 50.290966,
        approxAyanamsaVernalEquinoxDate: new Date(221, 2, 21),
        computationRequired: true
      },
      4:{
        system: 'deluce',
        referenceYear: 499,
        referenceAyanamsha: 21.01356,
        tropicalYear: 365.2425,
        precessionRate: 50.290966,
        approxAyanamsaVernalEquinoxDate: new Date(499, 2, 21),
        computationRequired: true
      },
      5:{
        system: 'yukteshwar',
        referenceYear: 1894,
        referenceAyanamsha: 0,
        tropicalYear: 365.2425,
        precessionRate: 50.290966,
        approxAyanamsaVernalEquinoxDate: new Date(1894, 2, 21),
        computationRequired: true
      },
      6:{
        system: 'hipparchus',
        referenceYear: -127,
        referenceAyanamsha: 29.0,
        tropicalYear: 365.2425,
        precessionRate: 50.290966,
        approxAyanamsaVernalEquinoxDate: new Date(-127, 2, 21),
        computationRequired: true
      },
      7:{
        system: 'aryabhata',
        referenceYear: 499,
        referenceAyanamsha: 23.6,
        tropicalYear: 365.2425,
        precessionRate: 50.290966,
        approxAyanamsaVernalEquinoxDate: new Date(499, 2, 21),
        computationRequired: true
      },
    };
    
    let selectedCorrectionSystem = correctionSystem[correctionIndex];
    selectedCorrectionSystem = selectedCorrectionSystem ?? correctionSystem[0];

    let ayanamsha = 0;
    if(selectedCorrectionSystem.computationRequired){
      ayanamsha = this.vernalPointLongitudeChange(this.getAstroDate(selectedCorrectionSystem.approxAyanamsaVernalEquinoxDate), this.getAstroDate(date));
    }else{
      ayanamsha = selectedCorrectionSystem.fixedValue
    }

    return ayanamsha;
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





  // --------------------- Mahuratas --------------------------

  //  pass prevous sun rise if current time is before sun rise

  getAllMahuratas(observer: AstroEngine.Observer): { [key: string]: any } {

    return {
      "abhijitMahuratam": this.getAbhijitMahuratam(this.panchangObj["sunRiseSet"], this.panchangObj["dayDuration"]),
      "chaughadiyaMahuratam": this.getChaughadiyaMahuratam(observer, this.panchangObj["sunRiseSet"], this.panchangObj["dayDuration"]),
      "trikalam": this.getTrikalam(this.panchangObj["sunRiseSet"], this.panchangObj["dayDuration"], this.panchangObj["vedicDayObj"]["day"]),
      "durMahuratam": this.getDurMahuratam(this.panchangObj["sunRiseSet"], this.panchangObj["dayDuration"], this.panchangObj["vedicDayObj"]["day"]),
      "varjayam": this.getVarjayam(this.panchangObj["nakshatraObj"], this.panchangObj['date']['timeStamp'])
    }

  }

  /*tested*/
  getAbhijitMahuratam(sunRiseSetObj: { [key: string]: any }, dayDiffernce: { [key: string]: any }): { [key: string]: any } {
    const dayMahurataDurationInMilliSec = dayDiffernce['dayDurationInMilliSec']/15;
    const nightMahurataDurationInMilliSec = dayDiffernce['nightDurationInMilliSec']/15;
    const dayDuratioAbhijitMahaurataStartTime = new Date((sunRiseSetObj['rise']['date'].getTime() +(dayDiffernce['dayDurationInMilliSec']/2)) - (dayMahurataDurationInMilliSec/2))
    const dayDuratioAbhijitMahaurataEndTime =  new Date((sunRiseSetObj['rise']['date'].getTime() +(dayDiffernce['dayDurationInMilliSec']/2) + (dayMahurataDurationInMilliSec/2)));
    const nightDuratioAbhijitMahaurataStartTime = new Date((sunRiseSetObj['set']['date'].getTime() +(dayDiffernce['nightDurationInMilliSec']/2)) - (nightMahurataDurationInMilliSec/2));
    const nightDuratioAbhijitMahaurataEndTime =  new Date((sunRiseSetObj['set']['date'].getTime() +(dayDiffernce['nightDurationInMilliSec']/2) + (nightMahurataDurationInMilliSec/2)));
    return { dayDuratioAbhijitMahaurataStartTime, dayDuratioAbhijitMahaurataEndTime, nightDuratioAbhijitMahaurataStartTime, nightDuratioAbhijitMahaurataEndTime};
  }

  /*tested*/
  getChaughadiyaMahuratam(observer: AstroEngine.Observer,sunRiseSetObj: { [key: string]: any }, dayDiffernce: { [key: string]: any }): { [key: string]: any } {
    const mahuratasTimings: { [key: string]: Array<any> } = { 'day': [], 'night': [] };
    const vedicWeekDay = this.getVaara(sunRiseSetObj['rise']['date'], sunRiseSetObj['rise']['date'])["day"];
    const nextSunRiseSet: { [key: string]: any } = this.getSunRiseSet(observer, new Date(sunRiseSetObj['rise']['date'].getTime()+86400000));
    const dayDurationInMilliSec = dayDiffernce['dayDurationInMilliSec'];
    const nightDurationInMilliSec = dayDiffernce['nightDurationInMilliSec'];
    const dayChaughadiya = ["Udvega","Amrita","Roga","Labha","Shubha","Chara","Kala"];
    const nightChaughadiya = ["Shubha","Chara","Kala","Udvega","Amrita","Roga","Labha"];
    const varaVela = ["Amrita", "Labha", "Udvega", "Roga", "Shubha", "Amrita", "Labha"]

    for (let i = 0; i < 8; i++) {
      let dayStartTime = sunRiseSetObj['rise']['date'].getTime() + ((i * dayDurationInMilliSec) / 8);
      mahuratasTimings['day'].push({ "startTimeinMilliSec": dayStartTime, startTime: new Date(dayStartTime) });
      let nightStartTime = sunRiseSetObj['set']['date'].getTime() + ((i * nightDurationInMilliSec) / 8);
      mahuratasTimings['night'].push({ "startTimeinMilliSec": nightStartTime, startTime: new Date(nightStartTime) });
    }

    for (let i = 0; i < 8; i++) {
      mahuratasTimings['day'][i]['endTimeinMilliSec'] = (i === 7) ? mahuratasTimings['night'][0]['startTimeinMilliSec'] : mahuratasTimings['day'][i+1]['startTimeinMilliSec'];
      mahuratasTimings['day'][i]['endTime'] = (i === 7) ? mahuratasTimings['night'][0]['startTime'] : mahuratasTimings['day'][i+1]['startTime'];
      let moduloDayIndex = i === 0 ? vedicWeekDay: ((mahuratasTimings['day'][i-1]['chaughadiyaIndex']+ 1) + 5)%7;
      moduloDayIndex = moduloDayIndex === 0 ? 7: moduloDayIndex;
      mahuratasTimings['day'][i]['chaughadiyaIndex'] = moduloDayIndex - 1;
      mahuratasTimings['day'][i]['chaughadiya'] = dayChaughadiya[moduloDayIndex-1];
      mahuratasTimings['day'][i]['specificMahurataTime'] =   dayChaughadiya[moduloDayIndex-1] === "Kala" ? "Kala Vela": (dayChaughadiya[moduloDayIndex-1] === varaVela[vedicWeekDay-1] ? "Vara Vela": null );
      mahuratasTimings['night'][i]['endTimeinMilliSec'] = (i === 7) ? nextSunRiseSet['rise']['date'].getTime() : mahuratasTimings['night'][i+1]['startTimeinMilliSec'];
      mahuratasTimings['night'][i]['endTime'] =(i === 7) ? nextSunRiseSet['rise']['date'] : mahuratasTimings['night'][i+1]['startTime'];
      let moduloNightIndex = i === 0 ? vedicWeekDay: ((mahuratasTimings['night'][i-1]['chaughadiyaIndex'] + 1) + 4)%7;
      moduloNightIndex = moduloNightIndex === 0 ? 7: moduloNightIndex;
      mahuratasTimings['night'][i]['chaughadiyaIndex'] = moduloNightIndex - 1;
      mahuratasTimings['night'][i]['chaughadiya'] = nightChaughadiya[moduloNightIndex-1];
      mahuratasTimings['night'][i]['specificMahurataTime'] =  nightChaughadiya[moduloDayIndex-1] === "Labha" ? "Kala Ratri": null;
    }
    return mahuratasTimings;
  }

  getTrikalam(sunRiseSetObj: { [key: string]: any }, dayDiffernce: { [key: string]: any }, weekday: number, option?: string): { [key: string]: any } {
    const offsets: any = {
      'rahu': [0.875, 0.125, 0.75, 0.5, 0.625, 0.375, 0.25],
      'gulika': [0.75, 0.625, 0.5, 0.375, 0.25, 0.125, 0.0],
      'yamaganda': [0.5, 0.375, 0.25, 0.125, 0.0, 0.75, 0.625]
    }

    if (option) {
      const startTime = sunRiseSetObj['rise']['date'].getTime() + dayDiffernce['dayDurationInMilliSec'] * offsets[option][weekday-1];
      const endTime = startTime + 0.125 * dayDiffernce['dayDurationInMilliSec'];
      const mahuratamObj = { startTimeInMilliSec: startTime, endTimeInMilliSec: endTime, startTime: new Date(startTime), endTime: new Date(endTime) };
      return mahuratamObj;
    }

    let trikalam = { 'rahuKalam': this.getTrikalam(sunRiseSetObj, dayDiffernce, weekday, 'rahu'), 'yamaganaKalam': this.getTrikalam(sunRiseSetObj, dayDiffernce, weekday, 'yamaganda'), 'gulikaKalam': this.getTrikalam(sunRiseSetObj, dayDiffernce, weekday, 'gulika') }
    
    console.log('trikalam.......', trikalam);
    
    return trikalam;
  }


  getDurMahuratam(sunRiseSetObj: { [key: string]: any }, dayDiffernce: { [key: string]: any }, weekday: number) {
    const offsets = [[10.4, 0.0], [6.4, 8.8], [2.4, 4.8], [5.6, 0.0], [4.0, 8.8], [2.4, 6.4], [1.6, 0.0]];
    weekday = weekday - 1;
    const dur = [dayDiffernce['dayDurationInMilliSec'], dayDiffernce['dayDurationInMilliSec']];
    const base = [sunRiseSetObj['rise']['date'].getTime(), sunRiseSetObj['rise']['date'].getTime()];

    if (weekday === 2) { dur[1] = dayDiffernce['nightDurationInMilliSec'] } else { base[1] = sunRiseSetObj['set']['date'].getTime() }

    const startTimes: Array<any> = [0, 0];
    const endTimes: Array<any> = [0, 0];

    for (let i = 0; i < 2; i++) {
      let offset = offsets[weekday][i];
      if (offset !== 0.0) {
        startTimes[i] = { "startTimeinMilliSec": (base[i] + dur[i] * offsets[weekday][i] / 12), startTime: new Date(base[i] + dur[i] * offsets[weekday][i] / 12) };
        endTimes[i] = { "endTimeinMilliSec": (startTimes[i]["startTime"].getTime() + dayDiffernce['dayDurationInMilliSec'] * 0.8 / 12), endTime: new Date(startTimes[i]["startTime"].getTime() + dayDiffernce['dayDurationInMilliSec'] * 0.8 / 12) };
      }
    }

    return { startTimes, endTimes };
  }



  getDishaSulam(vedicWeekDay: number): number {
    const dishashula: Array<number> = [2, 1, 3, 3, 4, 2, 1];
    return dishashula[vedicWeekDay];
  }

  getVarjayam(nakshatraObj: Array<{ [key: string]: any }>, todaysDateInMilliSec: number): Array<{ [key: string]: any }> {
    const startTimeBasedOnNakshatra: { [key: string]: any } = {
      1: { name: 'Ashwini', time: 72000000 }, 2: { name: 'Bharani', time: 33696000 }, 3: { name: 'Krittika', time: 43200000 }, 4: { name: 'Rohini', time: 57600000 }, 5: { name: 'Mrigashira', time: 19296000 },
      6: { name: 'Ardra', time: 29664000 }, 7: { name: 'Punarvasu', time: 43200000 }, 8: { name: 'Pushya', time: 28800000 }, 9: { name: 'Ashlesha', time: 44928000 }, 10: { name: 'Magha', time: 43200000 },
      11: { name: 'Purva Phalguni', time: 28800000 }, 12: { name: 'Uttara Phalguni', time: 25632000 }, 13: { name: 'Hasta', time: 29664000 }, 14: { name: 'Chitra', time: 28800000 },
      15: { name: 'Swati', time: 19296000 }, 16: { name: 'Vishakha', time: 19296000 }, 17: { name: 'Anuradha', time: 14400000 }, 18: { name: 'Jyeshtha', time: 19296000 }, 19: { name: 'Mula', time: 29664000 }, 20: { name: 'Purva Ashadha', time: 33696000 },
      21: { name: 'Uttara Ashadha', time: 28800000 }, 22: { name: 'Shravana', time: 14400000 }, 23: { name: 'Dhanishtha', time: 14400000 }, 24: { name: 'Shatabhishak', time: 25632000 },
      25: { name: 'Purva Bhadrapada', time: 22464000 }, 26: { name: 'Uttara Bhadrapada', time: 33696000 }, 27: { name: 'Revati', time: 43200000 }
    };

    const varjayam: Array<{ [key: string]: any }> = [];
    nakshatraObj.map((nakshatra) => {
      let charanTimesInMilliSec = nakshatra['nakshatraCharana']['charanaTimes'].map((element: Date) => element.getTime());
      let durationOfNakshata = (charanTimesInMilliSec[0] - charanTimesInMilliSec[4]);
      const startTime = charanTimesInMilliSec[4] + (startTimeBasedOnNakshatra[nakshatra['nakshatra']]['time'] / 86400000) * durationOfNakshata;
      const endTime = startTime + (durationOfNakshata * (5760000 / 86400000));
      varjayam.push({ startTime: new Date(startTime), endTime: new Date(endTime), isApplicableForToday: startTime >= todaysDateInMilliSec ? true : false });
    })

    return varjayam;
  }

  getVasa(tithiObj: { [key: string]: any }, vedicWeekDay: number): { [key: string]: any } {


    // vara: number;  // Vara (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  //   const shivavasaCycles = ["Agni", "Vayu", "Jala", "Prithvi"];
  //   return shivavasaCycles[(nakshatra - 1) % 4];

  //   const homahutiCycles = ["Agni", "Prithvi", "Vayu", "Jala"];
  //     return homahutiCycles[(tithi - 1) % 4];

  //   const bhadravasaLocations = [
  //     "Patala", "Bhu", "Antariksha", "Divya" // Simplified example
  //   ];
  //   return bhadravasaLocations[(tithi - 1) % 4];

  //   const shivavasaCycles = ["Agni", "Vayu", "Jala", "Prithvi"];
  // return shivavasaCycles[(nakshatra - 1) % 4];


  // const chandraDirections = [
  //   "South-East", // Sunday
  //   "South",      // Monday
  //   "South-West", // Tuesday
  //   "West",       // Wednesday
  //   "North-West", // Thursday
  //   "North",      // Friday
  //   "North-East", // Saturday
  // ];
  // return chandraDirections[vara % 7];

  // const rahuDirections = [
  //   "East",       // 1st, 9th, 17th, 25th Tithi
  //   "South-East", // 2nd, 10th, 18th, 26th Tithi
  //   "South",      // 3rd, 11th, 19th, 27th Tithi
  //   "South-West", // 4th, 12th, 20th, 28th Tithi
  //   "West",       // 5th, 13th, 21st, 29th Tithi
  //   "North-West", // 6th, 14th, 22nd, 30th Tithi
  //   "North",      // 7th, 15th, 23rd
  //   "North-East", // 8th, 16th, 24th
  // ];
  // return rahuDirections[(tithi - 1) % 8];


  // kumbha chakra
  // const directions = ["East", "South-East", "South", "South-West", "West", "North-West", "North", "North-East"];
  // const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  // return days.map((day, index) => ({
  //   day,
  //   direction: directions[index % directions.length],
  // }));



//   const dishaShoolaDirections = [
//     "East",       // Sunday
//     "West",       // Monday
//     "North",      // Tuesday
//     "South",      // Wednesday
//     "North-East", // Thursday
//     "South-East", // Friday
//     "North-West", // Saturday
//   ];
//   return dishaShoolaDirections[vara % 7];
// }


// const nakshatraShoolaDirections = [
//   "East",       // Ashwini, Bharani, Krittika
//   "South",      // Rohini, Mrigashira, Ardra
//   "West",       // Punarvasu, Pushya, Ashlesha
//   "North",      // Magha, Purva Phalguni, Uttara Phalguni
//   "South-East", // Hasta, Chitra, Swati
//   "North-West", // Vishakha, Anuradha, Jyeshtha
//   "South-West", // Mula, Purva Ashadha, Uttara Ashadha
//   "North-East", // Shravana, Dhanishta, Shatabhisha
//   "East",       // Purva Bhadrapada, Uttara Bhadrapada, Revati
// ];

// // Group of 3 Nakshatras per direction
// const groupIndex = Math.floor((nakshatra - 1) / 3);
// return nakshatraShoolaDirections[groupIndex % nakshatraShoolaDirections.length];

    const shaivaVasaIndex = ((tithiObj['tithi'] * 2) + 5) / 7;
    const agniVasaIndex = (((tithiObj['tithi'] + 1) + (vedicWeekDay + 1)) - 4) / 3;
    return { shaivaVasaIndex, agniVasaIndex, tithiEndTime: tithiObj['tithiEnd'] };
  }


  //   def gauri_chogadiya(jd, place):
  //   lat, lon, tz = place
  //   tz = place.timezone
  //   srise = swe.rise_trans(jd - tz/24, swe.SUN, lon, lat, rsmi = _rise_flags + swe.CALC_RISE)[1][0]
  //   sset = swe.rise_trans(jd - tz/24, swe.SUN, lon, lat, rsmi = _rise_flags + swe.CALC_SET)[1][0]
  //   day_dur = (sset - srise)

  //   end_times = []
  //   for i in range(1, 9):
  //     end_times.append(to_dms((srise + (i * day_dur) / 8 - jd) * 24 + tz))

  //   # Night duration = time from today's sunset to tomorrow's sunrise
  //   srise = swe.rise_trans((jd + 1) - tz/24, swe.SUN, lon, lat, rsmi = _rise_flags + swe.CALC_RISE)[1][0]
  //   night_dur = (srise - sset)
  //   for i in range(1, 9):
  //     end_times.append(to_dms((sset + (i * night_dur) / 8 - jd) * 24 + tz))

  //   return end_times

  // def trikalam(jd, place, option='rahu'):
  //   lat, lon, tz = place
  //   tz = place.timezone
  //   srise = swe.rise_trans(jd - tz/24, swe.SUN, lon, lat, rsmi = _rise_flags + swe.CALC_RISE)[1][0]
  //   sset = swe.rise_trans(jd - tz/24, swe.SUN, lon, lat, rsmi = _rise_flags + swe.CALC_SET)[1][0]
  //   day_dur = (sset - srise)
  //   weekday = vaara(jd)

  //   # value in each array is for given weekday (0 = sunday, etc.)
  //   offsets = { 'rahu': [0.875, 0.125, 0.75, 0.5, 0.625, 0.375, 0.25],
  //               'gulika': [0.75, 0.625, 0.5, 0.375, 0.25, 0.125, 0.0],
  //               'yamaganda': [0.5, 0.375, 0.25, 0.125, 0.0, 0.75, 0.625] }

  //   start_time = srise + day_dur * offsets[option][weekday]
  //   end_time = start_time + 0.125 * day_dur

  //   # to local timezone
  //   start_time = (start_time - jd) * 24 + tz
  //   end_time = (end_time - jd) * 24 + tz
  //   return [to_dms(start_time), to_dms(end_time)] # decimal hours to H:M:S

  // rahu_kalam = lambda jd, place: trikalam(jd, place, 'rahu')
  // yamaganda_kalam = lambda jd, place: trikalam(jd, place, 'yamaganda')
  // gulika_kalam = lambda jd, place: trikalam(jd, place, 'gulika')

  // def durmuhurtam(jd, place):
  //   lat, lon, tz = place
  //   tz = place.timezone

  //   # Night = today's sunset to tomorrow's sunrise
  //   sset = swe.rise_trans(jd - tz/24, swe.SUN, lon, lat, rsmi = _rise_flags + swe.CALC_SET)[1][0]
  //   srise = swe.rise_trans((jd + 1) - tz/24, swe.SUN, lon, lat, rsmi = _rise_flags + swe.CALC_RISE)[1][0]
  //   night_dur = (srise - sset)

  //   # Day = today's sunrise to today's sunset
  //   srise = swe.rise_trans(jd - tz/24, swe.SUN, lon, lat, rsmi = _rise_flags + swe.CALC_RISE)[1][0]
  //   day_dur = (sset - srise)

  //   weekday = vaara(jd)

  //   # There is one durmuhurtam on Sun, Wed, Sat; the rest have two
  //   offsets = [[10.4, 0.0],  # Sunday
  //              [6.4, 8.8],   # Monday
  //              [2.4, 4.8],   # Tuesday, [day_duration , night_duration]
  //              [5.6, 0.0],   # Wednesday
  //              [4.0, 8.8],   # Thursday
  //              [2.4, 6.4],   # Friday
  //              [1.6, 0.0]]   # Saturday

  //   # second durmuhurtam of tuesday uses night_duration instead of day_duration
  //   dur = [day_dur, day_dur]
  //   base = [srise, srise]
  //   if weekday == 2:  dur[1] = night_dur; base[1] = sset

  //   # compute start and end timings
  //   start_times = [0, 0]
  //   end_times = [0, 0]
  //   for i in range(0, 2):
  //     offset = offsets[weekday][i]
  //     if offset != 0.0:
  //       start_times[i] = base[i] + dur[i] * offsets[weekday][i] / 12
  //       end_times[i] = start_times[i] + day_dur * 0.8 / 12

  //       # convert to local time
  //       start_times[i] = (start_times[i] - jd) * 24 + tz
  //       end_times[i] = (end_times[i] - jd) * 24 + tz

  //   return [start_times, end_times]  # in decimal hours

  // def abhijit_muhurta(jd, place):
  //   """Abhijit muhurta is the 8th muhurta (middle one) of the 15 muhurtas
  //   during the day_duration (~12 hours)"""
  //   lat, lon, tz = place
  //   tz = place.timezone
  //   srise = swe.rise_trans(jd - tz/24, swe.SUN, lon, lat, rsmi = _rise_flags + swe.CALC_RISE)[1][0]
  //   sset = swe.rise_trans(jd - tz/24, swe.SUN, lon, lat, rsmi = _rise_flags + swe.CALC_SET)[1][0]
  //   day_dur = (sset - srise)

  //   start_time = srise + 7 / 15 * day_dur
  //   end_time = srise + 8 / 15 * day_dur

  //   # to local time
  //   return [(start_time - jd) * 24 + tz, (end_time - jd) * 24 + tz]


















}
