import { Component, OnInit } from '@angular/core';
import { PanchangService } from './panchang.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'vedic-panchang';
  public panchangObject: any = {};



  nakshatra: any = {
    1: 'Ashwini', 2: 'Bharani', 3: 'Krittika', 4: 'Rohini', 5: 'Mrigashira',
    6: 'Ardra', 7: 'Punarvasu', 8: 'Pushya', 9: 'Ashlesha', 10: 'Magha',
    11: 'Purva Phalguni', 12: 'Uttara Phalguni', 13: 'Hasta', 14: 'Chitra',
    15: 'Swati', 16: 'Vishakha', 17: 'Anuradha', 18: 'Jyeshtha', 19: 'Mula', 20: 'Purva Ashadha',
    21: 'Uttara Ashadha', 22: 'Shravana', 23: 'Dhanishtha', 24: 'Shatabhishak',
    25: 'Purva Bhadrapada', 26: 'Uttara Bhadrapada', 27: 'Revati'
  };
  charana: any = { 1: 'Parthama Charana', 2: 'Dwitiya Charana', 3: 'Tritiya Charana', 4: 'Chaturtha Charana' }
  days: any = { 1: 'Sunday', 2: 'Monday', 3: 'Tuesday', 4: 'Wednesday', 5: 'Thrusday', 6: 'Friday', 7: 'Saturday' };
  vedicDays: any = { 1: 'Ravivara', 2: 'Somvara', 3: 'Mangalvara', 4: 'Budhavara', 5: 'Guruvara', 6: 'Sukravara', 7: 'Shanivara' };
  tithi: any = {
    1: 'Pratipada', 2: 'Dwithiya', 3: 'Trithiya', 4: 'Chaturthi', 5: 'Panchami', 6: 'Shasthi', 7: 'Saptami',
    8: 'Ashtami', 9: 'Navami', 10: 'Dashami', 11: 'Ekadasi', 12: 'Dwadashi', 13: 'Thrayodashi', 14: 'Chaturdashi',
    15: 'Poornima',
    16: 'Pratipada', 17: 'Dwithiya', 18: 'Trithiya', 19: 'Chaturthi', 20: 'Panchami', 21: 'Shasthi', 22: 'Saptami',
    23: 'Ashtami', 24: 'Navami', 25: 'Dashami', 26: 'Ekadasi', 27: 'Dwadashi', 28: 'Thrayodashi', 29: 'Chaturdashi',
    30: 'Amavasya',
  }
  paksha: any = { 1: 'Sukla Paksha', 2: 'Krishna Paksha' };


  karana: any = {
    1: 'Kistughan', 2: 'Bava', 3: 'Balava', 4: 'Kaulava',
    5: 'Taytila', 6: 'Garaja', 7: 'Vanija', 8: 'Vishti', 9: 'Bava',
    10: 'Balava', 11: 'Kaulava', 12: 'Taytila', 13: 'Garaja', 14: 'Vanija',
    15: 'Vishti', 16: 'Bava', 17: 'Balava', 18: 'Kaulava', 19: 'Taytila', 20: 'Garaja',
    21: 'Vanija', 22: 'Vishti', 23: 'Bava', 24: 'Balava', 25: 'Kaulava', 26: 'Taytila',
    27: 'Garaja', 28: 'Vanija', 29: 'Vishti', 30: 'Bava', 31: 'Balava', 32: 'Kaulava',
    33: 'Taytila', 34: 'Garaja', 35: 'Vanija', 36: 'Vishti', 37: 'Bava', 38: 'Balava',
    39: 'Kaulava', 40: 'Taytila', 41: 'Garaja', 42: 'Vanija', 43: 'Vishti', 44: 'Bava',
    45: 'Balava', 46: 'Kaulava', 47: 'Taytila', 48: 'Garaja', 49: 'Vanija', 50: 'Vishti',
    51: 'Bava', 52: 'Balava', 53: 'Kaulava', 54: 'Taytila', 55: 'Garaja', 56: 'Vanija',
    57: 'Vishti', 58: 'Shakuni', 59: 'Chaturshpad', 60: 'Nag'
  }

  yoga: any = {
    1: 'Vishakumbha', 2: 'Preeti', 3: 'Aayushman', 4: 'Saubhagya', 5: 'Shobhana', 6: 'Atiganda',
    7: 'Sukarma', 8: 'Dhriti', 9: 'Shoola', 10: 'Ganda', 11: 'Vriddhi', 12: 'Dhruva', 13: 'Vyaghaata',
    14: 'Harshana', 15: 'Vajra', 16: 'Siddhi', 17: 'Vyatipaata', 18: 'Variyaana', 19: 'Parigha', 20: 'Shiva',
    21: 'Siddha', 22: 'Saaddhya', 23: 'Shubha', 24: 'Shukla', 25: 'Brahma', 26: 'Indra', 27: 'Vaidhriti',
  }

  ayana: any = { 1: 'Uttarayana', 2: 'Dakshinayana' }
  ritu: any = { 1: 'Vasant Ritu', 2: 'Grishma Ritu', 3: 'Varsha Ritu', 4: 'Sharad Ritu', 5: 'Hemant Ritu', 6: 'Shishir Ritu' };
  masa: any = { 1: 'Chaitra', 2: 'Vaisakha', 3: 'Jyaistha', 4: 'Asadha', 5: 'Shravana', 6: 'Bhadra', 7: 'Ashwin', 8: 'Kartika', 9: 'Mārgasirsa (Agrahayana)', 10: 'Pausha', 11: 'Magha', 12: 'Phalguna' };
  rashi: any = { 1: 'Mesh', 2: 'Vrishabh', 3: 'Mithun', 4: 'Kark', 5: 'Singh', 6: 'Kanya', 7: 'Tula', 8: 'Vrishchik', 9: 'Dhanu', 10: 'Makar', 11: 'Kumbh', 12: 'Meen' };
  pahara: any = {1: 'Purvanha', 2: 'Madhyanha', 3: 'Aparanha', 4: 'Sayanha', 5: 'Pradosha', 6: 'Nishitha', 7: 'Triyama', 8: 'Usha'}
  samvatsara: any = { 1: 'Prabhava', 2: 'Vibhava', 3: 'Shukla', 4: 'Pramoda', 5: 'Prajapati', 6: 'Angira', 7: 'Shrimukha', 8: 'Bhava', 9: 'Yuva', 10: 'Dhata', 11: 'Ishwara', 12: 'Bahudhanya', 13: 'Pramathi', 14: 'Vikrama', 15: 'Vrisha', 16: 'Chitrabhanu', 17: 'Subhanu', 18: 'Tarana', 19: 'Parthiva', 20: 'Vyaya', 21: 'Sarvajit', 22: 'Sarvadhari', 23: 'Virodhi', 24: 'Vikriti', 25: 'Khara', 26: 'Nandana', 27: 'Vijaya', 28: 'Jaya', 29: 'Manmatha', 30: 'Durmukha', 31: 'Hemalambi', 32: 'Vilambi', 33: 'Vikari', 34: 'Sharvari', 35: 'Plava', 36: 'Shubhakrit', 37: 'Shobhakrit', 38: 'Krodhi', 39: 'Vishvavasu', 40: 'Parabhava', 41: 'Plavanga', 42: 'Kilaka', 43: 'Saumya', 44: 'Sadharana', 45: 'Virodhakrit', 46: 'Paridhavi', 47: 'Pramadi', 48: 'Aananda', 49: 'Rakshasa', 50: 'Nala', 51: 'Pingala', 52: 'Kalayukta', 53: 'Siddharthi', 54: 'Raudra', 55: 'Durmati', 56: 'Dundubhi', 57: 'Rudhirodgari', 58: 'Raktaksha', 59: 'Krodhana', 60: 'Kshaya' };
 
  constructor(private _panchangService: PanchangService) {
  }

  ngOnInit(): void {
    this.getView()
  }

  getView(event?: any) {
    // issue in inversion of date : 1677174883080 / tithi : 1677180745998
    let obj: any = this._panchangService.getPanchang(event && event.target ? new Date(event.target.value) :new Date());
    console.log(obj);
    this.panchangObject = obj;
    this.panchangObject['date']['dayMap'] = this.days[(obj['date']['day'] + 1)];
    this.panchangObject['vedicDayObj']['vedicDayMap'] = this.vedicDays[obj['vedicDayObj']['day']];
    this.panchangObject['tithiObj'].forEach((element: any) => { element['pakshaMap'] = this.paksha[element['paksha']]; element['tithiMap'] = this.tithi[element['tithi']]; });
    this.panchangObject['nakshatraObj'].forEach((element: any) => { element['nakshatraMap'] = this.nakshatra[element['nakshatra']]; element['nakshatraCharanaMap'] = this.charana[element['nakshatraCharana']]; });
    this.panchangObject['yogaObj'].forEach((element: any) => { element['yogaMap'] = this.yoga[element['yog']]; });
    this.panchangObject['karanaObj'].forEach((element: any) => { element['karanaMap'] = this.karana[element['karana']]; });
    this.panchangObject['rashiObj']['moon'].forEach((element: any) => { element['moonRashiMap'] = this.rashi[element['rashi']]; }); 
    this.panchangObject['rashiObj']['sun'].forEach((element: any) => { element['sunRashiMap'] = this.rashi[element['rashi']]; }); 
    this.panchangObject['masaObj']['amantaMasaMap'] = this.masa[obj['masaObj']['amantaMasa']];
    this.panchangObject['masaObj']['amantaRituMap'] = this.ritu[obj['masaObj']['amantaRitu']];
    this.panchangObject['masaObj']['siderealRituMap'] = this.ritu[obj['masaObj']['siderealRitu']];
    this.panchangObject['masaObj']['ayanaMap'] = this.ayana[obj['masaObj']['ayana']];
    this.panchangObject['masaObj']['purnimantaMasaMap'] = this.masa[obj['masaObj']['purnimantaMasa']];
    this.panchangObject['dayDuration']['paharaMap'] = this.pahara[obj['dayDuration']['pahara']];
    this.panchangObject['calSystemObj']['vikramSamvatSaraMap'] = this.samvatsara[obj['calSystemObj']['vikramSamvatSara']];
    this.panchangObject['calSystemObj']['sakaSamvatSaraMap'] = this.samvatsara[obj['calSystemObj']['sakaSamvatSara']];
  }
}
