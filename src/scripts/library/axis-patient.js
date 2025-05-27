import { App } from "./axis-app";
import { dayNames, daysBetween } from "../_date";
export class Patient {
    constructor(app = new App()){
        this.app = app;
        this.name = null;
        this.dob = null;
        this.age = null;
        this.sex = null ;
        this.gender = null;
        this.occupation = null;
        this.phone = null;
        this.email = null;
        this.hasExamDue = null;
        this.hasFormsDue = null;
        this.hasPaymentDue = null;
        this.isMedicareEligible = null;
        this.address = {
            street: null,
            city: null,
            state: null,
            zip: null
        };
        this.familyHistory = [],
        this.medicalHistory = {
            conditions: [],
            injuries: [],
            surgeries: []
        }
        this.plan = {
            start: null,
            end: null,
            frequency: [],
            usedVisits: null,
            weeksRemaining: null,
        }
        this.previousVisit = {
            day: null,
            date: null,
            daysSince: null
        }
        this.problemHistory = {
            reason: null,
            problemList: [],
            onset: null,
            disability: [],
            goals: [],
            previousProviders: []
        }
        this.product = {
            type: null,
            cycleDate: null,
            visitsUsed: null,
            visitsRemaining: null,
            pendingCancellation: null
        }
        this.initialize(this.app);
    }
    initialize(app = new App()){
        if(app.isBackOffice && app.resource === "create-cert"){
            let patientNode = document.querySelector("#patientInfoSideTopBar");
            if(patientNode != null){
                for(const child of patientNode.parentElement.children){
                    const [key, val] = child.innerText.split(/:\s/g)
                    switch(key){
                        case "Patient Name":
                            this.name = val;
                            break;
                        case "Gender/age":
                            let [gender, age] = val.split(/\//g);
                            this.gender = gender;
                            this.age = age;
                            break;
                        case "DOB":
                            this.dob = val;
                            break;
                        case "Occupation":
                            this.occupation = val;
                            break;
                        case "Product Type":
                            this.product.type = val;
                            break;
                        case "Cycle Date":
                            this.product.cycleDate = val;
                            break;
                        case "Pending Cancellation":
                            this.product.pendingCancellation = /yes/gi.test(val);
                            break;
                        case "Last visit date":
                            const lvd = new Date(val.split(/\//g).reduce((acc, cv, i) => {
                                if(i) acc = `${cv}-${acc}`;
                                else acc += cv;
                                return acc;
                            },""));
                            this.previousVisit.day = dayNames[lvd.getDay()];
                            this.previousVisit.date = lvd;
                            this.previousVisit.daysSince = daysBetween(lvd, new Date());
                            break;
                        case "Next exam date":
                            let ned = new Date(val.split(/\//g).reduce((acc, cv, i) => {
                                if(i) acc = `${cv}-${acc}`;
                                else acc += cv;
                                return acc;
                            },""));
                            this.plan.end = ned;
                            ned = Math.ceil(daysBetween(ned, new Date()) / 7);
                            this.plan.weeksRemaining = ned > 0 ? ned : 0;
                            break;
                        case "Treatment":
                            this.plan.duration = val.split(/for a total of\s/gi)[1];
                            break;
                        case "Visits in current treatment":
                            let [used, total] = val.split(/\//g);
                            this.plan.usedVisits = used;
                            this.plan.totalVisits = total;
                            this.plan.visitsRemaining = total - used;
                            break;
                    }
                }
            }
        }
    }
    getTransactions(dateRange){

    }
    getTreatmentPlan(){

    }
    async getVisits(dateRange){
        if(this.app.isBackOffice && this.app.resource === "create-cert"){
            document.querySelectorAll("#visitsTable tbody tr").forEach(row => {
                const td = row.querySelectorAll("td");
                this.visits.push(
                    new Visit(
                        row.dataset.visitId, 
                        td[0].innerText, 
                        td[1].innerText, 
                        td[2].innerText, 
                        td[3].innerText
                    )
                )
            });
        }
    }
}
class Visit {
    constructor(id, date, type, clinic, doctor){
        this.id = null;
        this.href = window.location.href.replace(window.location.pathname.split("/").at(-1),this.id);
        this.clinic = null;
        this.date = null;
        this.doctor = null;
        this.type = null;
    }
    async getDetails(){
        try{
            const visit = await fetch(this.href, { method: "GET" });
            if(visit.ok) return new DOMParser().parseFromString(await res.text(), "text/html");
            else throw new Error(visit.statusText);
        } catch (error) {
            console.error(error);
            return new DOMParser().parseFromString("", "text/html");
        }
    }
    getAdjustmentsFromVisit(visit = new Document()){
        const array = []
        let region, segment, abbreviation;
        visit.querySelectorAll("#spinalAdj td button").forEach(button => {
            if(button.value){
                if(/[ctl][1-9]/gi.test(button.name)){
                    switch(String(button.name).at(0)){
                        case "c":
                            region = "cervical";
                            abbreviation = "C" + String(button.name).at(2);
                            break;
                        case "t":
                            region = "thoracic";
                            abbreviation = "T" + String(button.name).substring(2);
                            break;
                        case "l":
                            region = "lumbar";
                            abbreviation = "L" + String(button.name).at(2);
                            break;
                    }
                    segment = abbreviation;
                } else if(/pelv/gi.test(button.name)){
                    region = "pelvis";
                    abbreviation = String(button.name).at(-1).toUpperCase() += "IL";
                    if(abbreviation.at(0) === "L") {
                        segment = "left ilium";
                    }
                    else if(abbreviation.at(0) === "R") {
                        segment = "right ilium";
                    }
                } else if(/sacr/gi.test(button.name)) {
                    region = "pelvis";
                    abbreviation = "Sa";
                    segment = `sacrum`;
                } else if(/c0/gi.test(button.name)) {
                    region = "head";
                    abbreviation = "C0";
                    segment = "occiput";
                }
                array.push(new Adjustment({
                    region: region,
                    abbreviation: abbreviation,
                    segment: segment,
                    method: button.value
                }));
            }
        });
        visit.querySelectorAll("#extremitiesAdj td button").forEach(button => {
            if(button.value){
                if(/sh|st|ac|el|wr/gi.test(button.name)){
                    if(/sh/gi.test(button.name)){
                        region = "upper extremity";
                        segment = "glenohumeral";
                        abbreviation = "SH";
                    } else if(/sc/gi.test(button.name)){
                        region = "upper extremity";
                        segment = "sternoclavicular";
                        abbreviation = "SC";
                    } else if(/ac/gi.test(button.name)){
                        region = "upper extremity";
                        segment = "acromioclavicular";
                        abbreviation = "AC";
                    } else if(/el/gi.test(button.name)){
                        region = "upper extremity";
                        segment = "elbow";
                        abbreviation = "EL";
                    } else if(/wr/gi.test(button.name)){
                        region = "upper extremity";
                        segment = "wrist";
                        abbreviation = "WR";
                    }
                } else if (/hi|kn|an/gi.test(button.name)){
                    if(/hi/gi.test(button.name)){
                        region = "lower extremity";
                        segment = "hip";
                        abbreviation = "HIP";
                    } else if(/kn/gi.test(button.name)){
                        region = "lower extremity";
                        segment = "knee";
                        abbreviation = "KN";
                    } else if(/an/gi.test(button.name)){
                        region = "lower extremity";
                        segment = "ankle";
                        abbreviation = "AN";
                    }
                } else if(/rib/gi.test(button.name)){
                    region = "ribs";
                    segment = "rib";
                    abbreviation = "RIB";
                } else if(/tmj/gi.test(button.name)){
                    region = "tmj";
                    segment = "temporomandibular";
                    abbreviation = "TMJ";
                }
                array.push(new Adjustment({
                    region: region,
                    abbreviation: abbreviation,
                    segment: segment,
                    method: button.value
                }));
            }
            return array;
        });
    }
    getAppendedNotesFromVisit(visit = new Document()){
        let note;
        const array = [], obj = {}, prop = ["date", "doctor", "note"];
        visit.querySelectorAll("table#soapNotesTable tbody tr").forEach(tr => {
            tr.querySelectorAll("td").forEach((td, i) => {
                if(i === 2){
                    note = td.querySelector("span");
                    if(note) obj[prop[i]] = note.innerText;
                    else obj[prop[i]] = null;
                } else { 
                    obj[prop[i]] = td.innerText; 
                }
            });
            array.push(obj);
        });
        return array;
    }
    getDiagnosesFromVisit(visit = new Document()){

    }
    getGoalsFromVisit(visit = new Document()){
        const obj = { short: "", medium: "", long: "" };
        visit.querySelectorAll("#pills-vitals-goals select, #pills-vitals-goals input")
            .forEach(input => { 
                if(/goal/gi.test(input.name) && input.value){
                    if(/short/gi.test(input.name)) obj.short = input.value;
                    else if(/medium/gi.test(input.name)) obj.medium = input.value;
                    else if(/long/gi.test(input.name)) obj.long = input.value;
                    else if(/prognosis/gi.test(input.name)) obj.prognosis = input.value;
                }
            });
        return obj;
    }
    getHistoryFromVisit(visit = new Document()){
        const obj = {}
        visit.querySelectorAll("#currentHxData textarea").forEach(el => {
            obj[el.name] = el.value;
        });
        return obj;
    }
    getNeuroFindingsFromVisit(visit = new Document()){
        let test;
        const array = [];
        visit.querySelectorAll(`#pills-neurological tr`).forEach(el => {
            test = new SpecialTest({category: "neurologic"});
            tr.querySelectorAll("td").forEach((td, i) => {
                if(i){
                    td.querySelectorAll("input").forEach(input => {
                        if(/l\W/gi.test(input.name)) {
                            if(input.checked && input.value != 3){
                                test.result.left.positive = true;
                                test.result.left.diminished = [true, false][input.value - 1];
                            }
                        } else if(/l\W/gi.test(input.name)){
                            if(input.checked && input.value != 3){
                                test.result.right.positive = true;
                                test.result.right.diminished = [true, false][input.value - 1];
                            }
                        }
                        if(i === 1){
                            if(/sen/gi.test(input.id)){
                                test.subcategory = "sensory";
                            } else if(/mus/gi.test(input.id)) {
                                test.subcategory = "motor"; 
                            } else if(/bicep||brach||trice||patel||achil/gi.test(input.id)){
                                test.subcategory = "reflex"; 
                            }
                        }
                    });
                } else {
                    test.name = td.innerText;
                }
            });
            if(test.result.isPositive) array.push(test);
        });
        return array;
    }
    getOrthoFindingsFromVisit(visit = new Document()){
        const obj = {
            cervical: [], 
            thoracic: [], 
            lumbar: [], 
            sacoiliachip: [],
            shoulder: [], 
            elbow: [], 
            wrist: [], 
            knee: [],
            ankle: [], 
            other: []
        };
        let rows, test;
        for(const region of Object.keys()){
            rows = visit.querySelectorAll(`#pills-orthopedic #${region} table tbody tr`);
            rows.forEach(tr => {
                test = new SpecialTest({category: "orthopedic", subcategory: "musculoskeletal"});
                tr.querySelectorAll("td").forEach((td,i) => {
                    if(i && tr.length > 2){ 
                        td = td.querySelector("button");
                        if(/l\W/gi.test(td.name) || /_l_/gi.test(td.name)) {
                            test.result.right.positive = td.value ? td.value === 2 ? true : false : null;
                        } else if(/r\W/gi.test(td.name) || /_r_/gi.test(td.name)){
                            test.result.left.positive = td.value ? td.value === 2 ? true : false : null;
                        } else if(/_m_/gi.test(td.name)){
                            test.result.bilateral = td.value ? td.value === 2 ? true : false : null;
                        }
                    } else if (i) {
                        td = td.querySelector("button");
                        test.result.isPositive = td.value ? td.value === 2 ? true : false : null;
                    } else {
                        if(td.innerText){
                            test.name = td.innerText;
                        } else {
                            test.name = td.querySelector("input"); 
                        }
                    }
                });
                if(test.result.isPositive) obj[region].push(test);
            });
        }
        return obj;
    }
    getPalpatoryFindingsFromVisit(visit = new Document()){
        const array = [], collection = {};
        let finding, region, segment, abbreviation, side, severity;
        visit.querySelectorAll("#palpatoryAdj tr button.multiState").forEach(button => {
            if(button.value >= 0){
                if(/[ctl][lr][1-9]/gi.test(button.name)){
                    switch(String(button.name).at(0)){
                        case "c":
                            region = "cervical";
                            abbreviation = "C" + String(button.name).at(2);
                            break;
                        case "t":
                            region = "thoracic";
                            abbreviation = "T" + String(button.name).substring(2);
                            break;
                        case "l":
                            region = "lumbar";
                            abbreviation = "L" + String(button.name).at(2);
                            break;
                    }
                    side = String(button.name).at(1) === "l" ? "left" : "right";
                    segment = abbreviation;
                } else if(/pelv/gi.test(button.name)){
                    region = "pelvis";
                    abbreviation = String(button.name).at(-1).toUpperCase() += "IL";
                    if(abbreviation.at(0) === "L") {
                        side = "left";
                        segment = "left ilium";
                    }
                    else if(abbreviation.at(0) === "R") {
                        side = "right";
                        segment = "right ilium";
                    }
                } else if(/sacr/gi.test(button.name)) {
                    region = "pelvis";
                    abbreviation = "Sa";
                    side = String(button.name).at(1) === "l" ? "left" : "right";
                    segment = `${side} sacral ala`;    
                } else if(/c[lr]0/gi.test(button.name)) {
                    region = "head";
                    abbreviation = "C0";
                    side = String(button.name).at(1) === "l" ? "left" : "right";
                    segment = "occiput";
                }
                severity = [null, "mild", "moderate", "severe"][button.value];
                finding = new PalpatoryFinding({
                    region: region,
                    abbreviation: abbreviation,
                    side: side,
                    segment: segment,
                    severity: severity
                });
                // add finding to collection
                if(Object.hasOwn(collection, finding.region)){
                    collection[finding.region][finding.side].severity = finding.severity;
                } else { collection[finding.region] = finding; }
            }
        });
        // populate array and return array
        for(const [key, val] of Object.entries(collection)) array.push({key, val});
        return array;
    }
    getProblemsFromVisit(visit = new Document()){

    }
    getROMFindingsFromVisit(visit = new Document()){
        const array = [], range = [
            "flexion", 
            "extension",
            "leftLateralFlexion",
            "rightLateralFlexion",
            "leftRotation",
            "rightRotation"
        ];
        let test, restriction, pain;
        visit.querySelectorAll("#pills-rom #romCervicalLumbar table tbody").forEach((table, i) => {
            test = new MotionTest(["cervical", "lumbar"][i]);
            table.querySelectorAll("tr").forEach((tr, i) => {
                [restriction, pain] = tr.querySelectorAll("button");
                test.result[range[i]] = {
                    isRestricted: [restriction.value] ? true : false,
                    restrictionSeverity: [null, "mild", "moderate", "severe"][restriction.value],
                    isPainful: [pain.value] ? true : false,
                    painSeverity: [null, "mild", "moderate", "severe"][pain.value]
                }
            });
            array.push(test);
        });
        const collection = {};
        const left = {isRestricted: null, isPainful: null};
        const right = {isRestricted: null, isPainful: null};
        visit.querySelectorAll("table.upperLower tbody tr").forEach(tr => {
            [restriction, pain] = tr.querySelectorAll("button");
            if(restriction.value >= 0 || pain.value >= 0){
                // determine region and name
                if(/tmj/gi.test(restriction.name)){
                    test = new MotionTest({
                        region: "jaw",
                        name: "temporomandibular"
                    });
                } else if(/sh|ac|sc/gi.test(restriction.name)){
                    test = new MotionTest({
                        region: "shoulder",
                        name: (() => {
                            switch(restriction.name.substring(0,2)){
                                case "sh":
                                    return "glenohumeral";
                                case "ac":
                                    return "acromioclavicular";
                                case "sc":
                                    return "sternoclavicular";
                            }
                        })()
                    });
                } else if(/elbow/gi.test(restriction.name)){
                    test = new MotionTest({
                        region: "elbow",
                        name: "elbow"
                    });
                } else if(/wrist/gi.test(restriction.name)){
                    test = new MotionTest({
                        region: "jaw",
                        name: "wrist"
                    });
                } else if(/hip/gi.test(restriction.name)){
                    test = new MotionTest({
                        region: "jaw",
                        name: "hip"
                    });
                } else if(/knee/gi.test(restriction.name)){
                    test = new MotionTest({
                        region: "jaw",
                        name: "knee"
                    });
                } else if(/ankle/gi.test(restriction.name)){
                    test = new MotionTest({
                        region: "jaw",
                        name: "ankle"
                    });
                }
                // set sided findings
                if(/l_rom_c/gi.test(restriction.name)){
                    left = {
                        isRestricted: restriction.value === 2 ? true : restriction.value ? false : null,
                        isPainful: pain.value === 2 ? true : pain.value ? false : null
                    }
                } else if(/r_rom_c/gi.test(restriction.name)){
                    right = {
                        isRestricted: restriction.value === 2 ? true : restriction.value ? false : null,
                        isPainful: pain.value === 2 ? true : pain.value ? false : null
                    }
                }
                // set result property
                test.result = {
                    isRestricted: restriction.value === 2 ? true : restriction.value ? false : null,
                    isPainful: pain.value === 2 ? true : pain.value ? false : null,
                    left: left,
                    right: right
                }
                // add motion test to extremity collection
                if(Object.hasOwn(collection, test.region)) collection[test.region].push(test);
                else collection[test.region] = [test];   
            }
        });
        // populate array and return array
        for(const [key, val] of Object.entries(collection)) array.push({key, val});
        return array;
    }
    getVitalSignsFromVisit(visit = new Document()){
        const obj = new Vitals();
        visit.querySelectorAll("#pills-vitals-goals select, #pills-vitals-goals input")
            .forEach(input => {
                if(/systolic|diastolic|location/gi.test(input.name)){
                    obj.blood.bloodPressure[input.name.split(/_c/gi)[0]] = input.value;
                } else if(/reading[ft]/gi.test(input.name)){
                    obj.temperature[input.name.split(/reading|_c/gi)[1]] = input.value;
                } else if(/height/gi.test(input.name)){
                    obj.height[input.name.split(/height|_c/gi)[1]] = input.value;
                } else if(/weight/gi.test(input.name)){
                    if(/report/gi.test(input.name)) obj.weight.source = input.value;
                    else obj.weight.lbs = input.value;
                } else if(/pulse|reading/gi.test(input.name)){
                    switch(input.name){
                        case "pulseside_c":
                            obj.pulse.side = input.value;
                            break;
                        case "pulsepart_c":
                            obj.pulse.site = input.value;
                            break;
                        case "reading_c":
                            obj.pulse.rate = input.value;
                            break;
                    }
                } else if(/rrate|measured/gi.test(input.name)){
                    if(input.name === "rrate_c") obj.respiration.rate = input.value;
                    else if(input)obj.respiration.position = input.value;
                }
            });
        return obj;
    }
}
class Adjustment {
    constructor(segment = "", method = "", technique = "diversified"){
        this.listing = null;
        this.method = method;
        this.region = this.getRegion(this.segment);
        this.segment = segment;
        this.technique = technique;
    }
    getRegion(segment){
        if(/c0/gi.test(segment)) return "head";
        if(/c[1-7]/gi.test(segment)) return "cervical";
        if(/t[1-12]/gi.test(segment)) return "thoracic";
        if(/l[1-5]/gi.test(segment)) return "lumbar";
        if(/pelvis/gi.test(segment)) return "pelvis";
        if(/sacrum/gi.test(segment)) return "sacrum";
        if(/sh|st|ac|el|wr/gi.test(segment)) return "upper extremity";
        if(/hi|kn|an/gi.test(segment)) return "lower extremity";
        if(/rib/gi.test(segment)) return "rib";
        return null;
    }
}
class MotionTest {
    constructor(){
        
    }
}
class PalpatoryFinding{
    constructor(){

    }
}
class SpecialTest{
    constructor(){

    }
}
class Vitals{
    constructor(){

    }
}
