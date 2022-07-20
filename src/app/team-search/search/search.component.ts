import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

  constructor() { }

  isShown: boolean = true; // show by default
  iconOpen: String = "../../../assets/images/SectionHeader/opener_opened.png";

  criteriaShow() {
    console.log("isShown" + this.isShown)
    this.isShown = !this.isShown;
    if (this.isShown) {
      this.iconOpen = "../../../assets/images/SectionHeader/opener_opened.png";
    } else {
      this.iconOpen = "../../../assets/images/SectionHeader/opener_closed.png";
    }
  }

  ngOnInit(): void {
  }

  getDailyPlanning(): void {
    console.log("getDailyPlanning");
    
  }
}
