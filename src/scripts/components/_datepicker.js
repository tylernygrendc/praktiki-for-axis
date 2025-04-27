import { dayNames, monthNames, daysIn } from "../_date.js";
import { Child } from "../_child.js";

class MDCalendarDay extends HTMLElement {
    constructor(){
        super();
        this["grid-slot"] = 0;
        this["selected"] = false;
        this["value"] = "";
    }
    connectedCallback(){
        this.addEventListener("click", (e) => {
            this.parentElement.getElementsByTagName("md-calendar-day")
                .forEach(button => {
                    delete button.selected;
                });
            this.selected = true;
            this.parentElement.value = this.value;
        }, {signal: this.parentElement.abortController.signal});
    }
}
class MDCalendar extends HTMLElement {

    static observedAttributes = ["value"];

    constructor(){
        super();
        this.abortController = new AbortController();
        this.calendarArray = calendarArray;
        this.dayNames = dayNames;
    }
    attributeChangedCallback(name, oldValue, newValue){
        if(name === "value") {
            let selectedDate = new Date(newValue);
            this.month = this.dayNames[selectedDate.getMonth()];
            this.year = selectedDate.getFullYear();
            this["aria-label"] = `select date in ${this.month}, ${this.year}`;
            this.parentElement.getElementsByTagName("md-text-field")[0].value = newValue;
        }
    }
    connectedCallback(){
        let container = document.createElement("div"), weekday;
            container.classList.add("weekday-labels");
            container.ariaHidden = true;
        for(const day of ["S","M","T","W","T","F","S"]){
            let weekday = document.createElement("div");
                weekday.append(document.createTextNode(day));
            container.append(weekday);
        }
        this.append(container);
        this.update();
    }
    disconnectedCallback(){
        this.abortController.abort();
    }
    update(date = new Date()){
        const calendarArray = this.calendarArray(date);
        document.querySelectorAll("md-calendar-day").forEach(el => { el.remove() });
        for(let i = 0; i < calendarArray.length; ++i){
            if(calendarArray[i] != null) {
                let day = document.createElement("md-calendar-day");
                    day["grid-slot"] = i;
                    day["value"] = `${this.year}-${this.month}-${calendarArray[i]}`;
                    day.append(document.createTextNode(String(calendarArray[i])));
                this.append(day);
            }
        }
    }
}
class MDDatePicker extends HTMLElement {

    static observedAttributes = ["value"];

    constructor(){
        super();
    }

    connectedCallback(){
        // label
        let [label, output, toggle, calendar, fieldset] = document.createElement("label");
            label.append(document.createTextNode("Select Date"));
        // output
        let 
        // icon button ()
        // calendar panel
            // month date drop down
            // arrows left right
            // calendar grid panel
            // year chipset panel
        // input panel
        // divider
        // ok/cancel actions
        let shadowHost = this.attachShadow({mode: "open"});
        
    }
    disconnectedCallback(){

    }
}
function calendarArray(date){
    let array = [];
    const year = date.getFullYear(), month = date.getMonth();
    const offset = new Date(year, month, 1).getDay();
    const monthDays = daysIn(month, year);
    const remainder = 42 - (offset + monthDays);
    for(let i = 1; i <= monthDays; ++i) array.push(i);
    for(let i = 0; i < offset; ++i) array.unshift(null);
    for(let i = 0; i < remainder; ++i) array.push(null);
    return array;
}

customElements.define("md-calendar-day", MDCalendarDay);
customElements.define("md-calendar", MDCalendar);
customElements.define("md-date-picker", MDDatePicker);