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
    getAdjustments(visit = ""){
        const spinalAdj = document.querySelectorAll("#spinalAdj table td button");
        const extremitiesAdj = document.querySelectorAll("#extremitiesAdj table td button");
        for(const segment of spinalAdj){
            if(segment.value) this.adjustment[segment.name] = new Adjustment(segment.name, segment.value);
        }
        for(const segment of extremitiesAdj){
            if(segment.value) this.adjustment[segment.name] = new Adjustment(segment.name, segment.value)
        }
    }
    getProblems(){

    }
    getDiagnoses(){

    }
    getTransactions(dateRange){

    }
    getTreatment(){

    }
    async getVisits(dateRange){
        if(this.app.isBackOffice && this.app.resource === "create-cert"){
            document.querySelectorAll("#visitsTable tr").forEach(row => {
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
        this.initialize();
    }
    async initialize(){
        await this.visitDetails(this.id);
    }
    async visitDetails(id){
        try{
            let res = await fetch(this.href, { method: "GET" });
            if(res.ok) res = new DOMParser().parseFromString(await res.text(), "text/html");
            const .querySelectorAll("")
        } catch (error) {

        }
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
