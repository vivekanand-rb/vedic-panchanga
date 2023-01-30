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



  nakshatra = {
    1: 'Ashwini', 2: 'Bharani', 3: 'Krittika', 4: 'Rohini', 5: 'Mrigashira',
    6: 'Ardra', 7: 'Punarvasu', 8: 'Pushya', 9: 'Ashlesha', 10: 'Magha',
    11: 'Purva Phalguni', 12: 'Uttara Phalguni', 13: 'Hasta', 14: 'Chitra',
    15: 'Swati', 16: 'Vishaka', 17: 'Anurada', 18: 'Jyeshta', 19: 'Mula', 20: 'Purva Ashadha',
    21: 'Uttara Ashadha', 22: 'Shravana', 23: 'Dhanishta', 24: 'Shatabhishak',
    25: 'Purva Bhadrapada', 26: 'Uttara Bhadrapada', 27: 'Revati'
  };
  days: any = { 1: 'Sunday', 2: 'Monday', 3: 'Tuesday', 4: 'Wednesday', 5: 'Thrusday', 6: 'Friday', 7: 'Saturday' };
  vedicDays: any = { 1: 'Ravivara', 2: 'Somvara', 3: 'Mangalvara', 4: 'Budhavara', 5: 'Guruvarar', 6: 'Sukravaar', 7: 'Shanivaar' };
  tithi = {
    1: 'Pratipada', 2: 'Dwithiya', 3: 'Trithiya', 4: 'Chaturthi', 5: 'Panchami', 6: 'Shasthi', 7: 'Saptami',
    8: 'Ashtami', 9: 'Navami', 10: 'Dashami', 11: 'Ekadasi', 12: 'Dwadashi', 13: 'Thrayodashi', 14: 'Chaturdashi',
    15: 'Amavasya',
    16: 'Pratipada', 17: 'Dwithiya', 18: 'Trithiya', 19: 'Chaturthi', 20: 'Panchami', 21: 'Shasthi', 22: 'Saptami',
    23: 'Ashtami', 24: 'Navami', 25: 'Dashami', 26: 'Ekadasi', 27: 'Dwadashi', 28: 'Thrayodashi', 29: 'Chaturdashi',
    30: 'Poornima',
  }
  paksha:any = {1:'Sukla Paksha', 2: 'Krishna Paksha'};
  
  karana = ['Bav', 'Balav', 'Kaulav', 'Taytil', 'Gar', 'Vanij', 'Vishti',
  'Bav', 'Balav', 'Kaulav', 'Taytil', 'Gar', 'Vanij', 'Vishti',
  'Bav', 'Balav', 'Kaulav', 'Taytil', 'Gar', 'Vanij', 'Vishti',
  'Bav', 'Balav', 'Kaulav', 'Taytil', 'Gar', 'Vanij', 'Vishti',
  'Shakuni', 'Chaturshpad',
  'Bav', 'Balav', 'Kaulav', 'Taytil', 'Gar', 'Vanij', 'Vishti',
  'Bav', 'Balav', 'Kaulav', 'Taytil', 'Gar', 'Vanij', 'Vishti',
  'Bav', 'Balav', 'Kaulav', 'Taytil', 'Gar', 'Vanij', 'Vishti',
  'Bav', 'Balav', 'Kaulav', 'Taytil', 'Gar', 'Vanij', 'Vishti',
   'Nag', 'Kistughan'];

  yoga = {
    1: 'Vishakumbha', 2: 'Preeti', 3: 'Aayushman', 4: 'Saubhagya', 5: 'Shobhana', 6: 'Atiganda',
    7: 'Sukarma', 8: 'Dhriti', 9: 'Shoola', 10: 'Ganda', 11: 'Vriddhi', 12: 'Dhruva', 13: 'Vyaghaata',
    14: 'Harshana', 15: 'Vajra', 16: 'Siddhi', 17: 'Vyatipaata', 18: 'Variyaana', 19: 'Parigha', 20: 'Shiva',
    21: 'Siddha', 22: 'Saaddhya', 23: 'Shubha', 24: 'Shukla', 25: 'Brahma', 26: 'Indra', 27: 'Vaidhriti',
  }
  
  ritu = { 1:'Vasant Ritu', 2:'Grishma Ritu', 3:'Varsha Ritu', 4:'Sharad Ritu', 5:'Hemant Ritu', 6:'Shishir Ritu' };
  masa = {  1:'Chaitra', 2:'Vaisakha', 3:'Jyaistha', 4:'Asadha', 5:'Shravana', 6:'Bhadra', 7:'Ashwin', 8:'Kartika', 9: 'Mārgasirsa (Agrahayana)', 10:'Pausha', 11:'Magha', 12:'Phalguna' };
  rashi = { 1: 'Mesh', 2: 'Vrishabh', 3: 'Mithun', 4: 'Kark', 5: 'Singh', 6: 'Kanya', 7: 'Tula', 8: 'Vrishchik', 9: 'Dhanu', 10: 'Makar', 11: 'Kumbh', 12: 'Meen' };

  constructor(private _panchangService: PanchangService){ 
  }

 ngOnInit(): void {
   this.getView()
 }
 getView(){
 let obj:any = this._panchangService.getPanchang(new Date());
 console.log(obj);
  this.panchangObject = obj;
  this.panchangObject['date']['dayMap'] = this.days[(obj['date']['day']+1)];
  this.panchangObject['vedicDayObj']['vedicDayMap'] = this.vedicDays[obj['vedicDayObj']['day']];
  this.panchangObject['tithiObj']['pakshaMap'] = this.paksha[obj['tithiObj']['paksha']];
  }
}
