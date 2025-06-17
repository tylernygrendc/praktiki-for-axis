import { App } from "./axis-app";
import { assertElement } from "../_utilities";
import { dayNames, daysBetween } from "../_date";
export class BackOfficePatient {
    constructor(docRef = document){
        this.id = "";
        // basic information
        this.name = "";
        this.fname = "";
        this.lname = "";
        this.initials = "";
        this.finitial = "";
        this.linitial = "";
        this.dob = null;
        this.age = 0;
        this.sex = "";
        this.gender = "";
        this.occupation = "";
        this.phone = "";
        this.email = "";
        this.address = {
            street: "",
            city: "",
            state: "",
            zip: ""
        };
        // flags
        this.hasABNDue = null;
        this.hasDoNotAdjust = null;
        this.hasExamDue = null;
        this.hasFormsDue = null;
        this.hasPaymentDue = null;
        this.hasOpenTask = null;
        this.hasSeeNotesFlag = null;
        this.isMedicareEligible = null;
        this.isMilitary = null;
        this.isNewPatient = null;
        // general notes
        this.generalNotes = "";
        // areas of concern
        this.areasOfConcern = "";
        // intake and other documents
        this.documentMap = {};
        this.intake = {
            comments: "",
            problemList: [],
            pregnancyDueDate: null,
            reason: [],
            mskHistory: {
                exists: false,
                list: []
            },
            medicalHistory: {
                exists: false,
                list: []
            },
            familyHistory: {
                exists: false,
                list: []
            },
            surgicalHistory: {
                exists: false,
                list: []
            },
            reviewOfSystems: {
                exists: false,
                list: []
            },
            traumaHistory: {
                exists: false,
                list: []
            },
            hospitalizationHistory: {
                exists: false,
                list: []
            },
            medicationHistory: {
                exists: false,
                list: []
            }
        }
        // progress tracking
        this.plan = {
            start: null,
            end: null,
            frequency: [],
            usedVisits: null,
            weeksRemaining: null,
        }
        this.previousExam = {
            day: null,
            date: null,
            daysSince: null,
            note: null
        }
        this.previousVisit = {
            day: null,
            date: null,
            daysSince: null,
            note: null
        }
        this.problemHistory = {
            reason: null,
            problemList: [],
            onset: null,
            disability: [],
            goals: [],
            previousProviders: []
        }
        // business
        this.product = {
            type: null,
            cycleDate: null,
            hasBalance: null,
            balanceDue: 0,
            visitsUsed: null,
            visitsRemaining: null,
            pendingCancellation: null
        }
        this.getInformationFromSidebar(docRef)
            .getAccountDetails(this.fname, this.lname, this.dob)
            .getAreasOfConcern(docRef)
            .getDocumentMap(docRef)
            .getGeneralNotes(docRef)
            .getIntake(docRef)
            .getPreviousExamAndVisit(docRef);
    }
    getInformationFromSidebar(docRef = document){
        const patientNode = document.querySelector("#patientInfoSideTopBar");
        if(patientNode != null){
            for(const child of patientNode.parentElement.children){
                const [key, val] = child.innerText.split(/:\s/g)
                switch(key){
                    case "Patient Name":
                        this.name = val;
                        [this.fname, this.lname] = /^\s*(\w+)|\b(\w+)(?=\S*$)/g.exec(val);
                        [this.finitial, this.linitial] = /^\s*(\w)|\b(\w)(?=\S*$)/g.exec(val);
                        this.initials = String(this.finitial.toUpperCase()) + String(this.linitial).toUpperCase();
                        break;
                    case "Gender/age":
                        [this.gender, this.age] = val.split(/\//g);
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
                        this.previousVisit.date = new Date(val.split(/\//g).reduce((acc, cv, i) => {
                            if(i) acc = `${cv}-${acc}`;
                            else acc += cv;
                            return acc;
                        },""));
                        this.previousVisit.day = dayNames[this.previousVisit.date.getDay()];
                        this.previousVisit.daysSince = daysBetween(this.previousVisit.date, new Date());
                        break;
                    case "Next exam date":
                        this.plan.end = new Date(val.split(/\//g).reduce((acc, cv, i) => {
                            if(i) acc = `${cv}-${acc}`;
                            else acc += cv;
                            return acc;
                        },""));
                        this.plan.weeksRemaining = Math.ceil(daysBetween(this.plan.end, new Date()) / 7);
                        break;
                    case "Treatment":
                        this.plan.duration = val.split(/for a total of\s/gi)[1];
                        break;
                    case "Visits in current treatment":
                        [this.plan.usedVisits, this.plan.totalVisits] = val.split(/\//g);
                        this.plan.visitsRemaining = this.plan.totalVisits - this.plan.usedVisits;
                        break;
                }
            }
            this.email = assertElement(docRef.querySelector("button#emailHomeInstructions")).value;
        }
        return this;
    }
    async getAccountDetails(fname = "", lname = "", dob = "", phone = ""){
        try{
            let res = await fetch("https://backoffice.thejoint.com/patient-search", {
                "body": `first_name=${fname}]&last_name=${lname}&dob=${dob}&phone=${phone}`,
                "method": "POST"
            });    
            if(res.ok) res = await res.json();
            else throw new Error(res.statusText);
            if(res.search_patients.length === 1) {               
                this.id = res.search_patients[0].id;
                this.phone = res.search_patients[0].phone_mobile;
                // flags
                this.hasABNDue = res.search_patients[0].abn_c ? true : false;
                this.hasDoNotAdjust = res.search_patients[0].has_do_not_adjust ? true : false;
                this.hasFormsDue = res.search_patients[0].needs_forms_c ? true : false;
                this.hasOpenTask = res.search_patients[0].ot ? true : false;
                this.hasPaymentDue = res.search_patients[0].pay_flag ? true : false;
                this.hasSeeNotesFlag = res.search_patients[0].see_notes ? true : false;
                this.isMedicareEligible = res.search_patients[0].ismedicareeligible_c ? true : false;
                this.isMilitary = res.search_patients[0].is_military ? true : false;
                this.isNewPatient = res.search_patients[0].new_patient_flag_c ? true : false;
                this.product.type = res.search_patients[0].producttype_c;
                // previous visit
                this.previousVisit.date = new Date(res.search_patients[0].lastvisitdate_c);
                this.previousVisit.doctor = `Dr. ${res.search_patients[0].last_dc_name}`;
                this.previousVisit.id = res.search_patients[0].lastvisitid_c;
                // product
                this.product.cycleDate = res.search_patients[0].recurringday;
                this.product.visitsRemaining = res.search_patients[0].rpv_c;
                this.product.hasBalance = res.search_patients[0].pay_flag ? true : false;
                this.product.balanceDue = res.search_patients[0].balance;
                this.product.careCardsRemaining = res.search_patients[0].carecard_c;
                this.product.homeClinic = res.search_patients[0].tj_clinics_contacts_1_name;
            } else {
                throw new Error("Patient search returned an unexpected number of results.");
            }
        } catch (error) {
            console.error(error);
        } finally{
            return this;
        }
    }
    getAreasOfConcern(docRef = document){
        this.areasOfConcern = assertElement(docRef.querySelector("textarea[name=spinal_concern_c]")).value;
        return this;
    }
    getDocumentMap(docRef = document){
        docRef.querySelectorAll("tbody#patientDocList tr").forEach(tr => {
            let [fileName, category, date] = tr.querySelectorAll("td");
            if(/other/gi.test(category.innerText)){
                if(/wr|review/gi.test(fileName.innerText) && !(/wr/gi.test(this.initials))){
                    category = "Wellness Review";
                } else if(/id|license|photo/gi.test(fileName.innerText)){
                    category = "Driver's License";
                } else {
                    category = "Other";
                }
            }
            Object.assign(this.documentMap[category], {
                fileName: fileName.innerText,
                date: date.innerText,
                href: `https://backoffice.thejoint.com/get-patient-doc/${tr.dataset.document_id}/${tr.dataset.document_name}`
            });
        });    
        return this;
    }
    getGeneralNotes(docRef = document){
        this.generalNotes = assertElement(docRef.querySelector("textarea#generalNotes")).value;
        return this;
    }
    getIntake(docRef = document){
        // get doctor comments from intake
        this.intake.comments = assertElement(docRef.querySelector("#pills-beta_patient_hx textarea#dc_notes")).value;
        // get pregnancy due date from intake
        this.intake.pregnancyDueDate = assertElement(docRef.querySelector("#pregnancy_due_date")).value;
        // get problem list from intake
        docRef.querySelectorAll("#pills-beta_patient_hx #complaint_areas tbody tr").forEach((tr, i) => {
            tr.querySelectorAll("td").forEach(td => {
                if(td.children.length) Object.assign(this.intake.problemList[i],{[td.firstChild.name]: td.firstChild.value});
                else Object.assign(this.intake.problemList[i],{"name": td.innerText});
            });
        });
        // get reason for seeking care, musculoskeletal history, medical history, family history, and review of systems from intake
        docRef.querySelectorAll("#pills-beta_patient_hx input[type=checkbox]").forEach(input => {
            if(input.checked){
                if(/reason/gi.test(input.name)){
                    this.intake.reason = input.parentElement.innerText;
                } else if(/history/gi.test(input.name)){
                    this.intake.mskHistory.exists = true;
                    if(!(/na\W/gi.test(input.name))) this.intake.mskHistory.list.push(String(input.parentElement.innerText).replace(/\/discomfort/gi,""));    
                } else if(/^c/gi.test(input.name)){
                    this.intake.medicalHistory.exists = true;
                    if(!(/na\W/gi.test(input.name)) && !(/other\W/gi.test(input.name))) this.intake.medicalHistory.list.push(input.parentElement.innerText);
                    else if(/other\W/gi.test(input.name)) this.intake.medicalHistory.list.push(assertElement(docRef.querySelector("#pills-beta_patient_hx textarea[name=callergiesdesc]")).value);
                } else if(/^fh/gi.test(input.name)){
                    this.intake.familyHistory.exists = true;
                    if(!(/na\W/gi.test(input.name))) this.intake.familyHistory.list.push(String(input.parentElement.innerText).replace(/\W\s/gi,""));
                } else {
                    this.intake.reviewOfSystems.exists = true;
                    if(!(/na\W/gi.test(input.name))) this.intake.reviewOfSystems.list.push(String(input.parentElement.innerText).replace(/\sor\s/gi,"/"));
                }
            }
        });
        // get surgical, trauma, and hospitalization histories from intake
        docRef.querySelectorAll("#surgeries_details_beta, #bbones_details_beta, #hospitalization_details_beta").forEach(div => {
            let prop = (() => {
                if(/surgeries/gi.test(div.id)) return "surgicalHistory";
                else if(/bones/gi.test(div.id)) return "traumaHistory";
                else if(/hospitalization/gi.test(div.id)) return "hospitalizationHistory";
            })();
            div.parentElement.querySelectorAll("input[type=radio]").forEach(input => {
                if(input.checked) this.intake[prop]["exists"] = true;
            });
            let textarea = div.parentElement.querySelector("textarea");
            if(textarea.value) {
                const array = assertElement(div.parentElement.querySelector("textarea")).value.split(/\s\-\s|\n/gi);
                for(let i = 0; i < array.length; ++i) Object.assign(this.intake[prop]["list"],{[array[i]]:array[++i]});
            }
        });
        // get medication list from intake
        docRef.querySelectorAll("input[name=currentprescription]").forEach(input => {
            if(input.checked) this.intake.medicationHistory.exists = true;
        });
        this.intake.medicationHistory.list = String(assertElement(docRef.querySelector("textarea[name=prescripyes]")).value)
            .split(/\,|\;/g).reduce((acc, cv) => {
                acc.push(cv.replace(/\W\s|\s\W/g,"").toLowerCase()); return acc;
            },[]);
        // get disability list and goals from intake
        docRef.querySelectorAll("#pills-beta_activity_assessment input[type=checkbox]").forEach(input => {
            if(input.checked){
                if(/condi/gi.test(input.name)){
                    input.name = String(input.name).replace(/condition_interfering_|condition_difficulties_/gi,"");
                    switch(input.name){
                        case "sportshobbies":
                            this.intake.disability.list.push("recreational activities");
                            break;
                        case "lyingdown":
                            this.intake.disability.list.push("lying down");
                            break;
                        default:
                            this.intake.disability.list.push(input.name);
                            break;
                    }
                } else if(/goals/gi.test(input.name)){
                    this.intake.goals.list.push(String(input.name).replace(/goals_/gi,"").replace("_"," "));
                }
            }
        });
        return this;
    }
    async getPreviousExamAndVisit(docRef = document){
        // get most recent visit and exam
        docRef.querySelectorAll("tbody#visitsTable tr").forEach(async (tr, i) => {
            if(i === 0) this.previousVisit.note = new BackOfficeVisit(tr.dataset.visit_id);
            if(/E/gi.test(tr.querySelectorAll("td")[1].innerText) && this.previousExam.date === null) {
                this.previousExam.note = new BackOfficeVisit(tr.dataset.visit_id);
            }
        });
        return this;
    }
}
class BackOfficeVisit {
    constructor(id){
        this.id = id;
        this.init();
    }
    async init(){
        const visit = await this.getVisitById(this.id);
        this.getAdjustmentsFromVisit(visit);
        this.getAppendedNotesFromVisit(visit);
        this.getDiagnosesFromVisit(visit);
        this.getGoalsFromVisit(visit);
        this.getHistoryFromVisit(visit);
        this.getHomeInstructionsFromVisit(visit);
        this.getMetaDataFromVisit(visit);
        this.getNeuroFindingsFromVisit(visit);
        this.getOrthoFindingsFromVisit(visit);
        this.getPalpatoryFindingsFromVisit(visit);
        this.getProblemsFromVisit(visit);
        this.getReferralsFromVisit(visit);
        this.getROMFindingsFromVisit(visit);
        this.getTreatmentPlanFromVisit(visit);
        this.getVitalSignsFromVisit(visit);
    }
    async getVisitById(id = this.id){
        try{
            const visit = await fetch(window.location.href.replace(window.location.pathname.split("/").at(-1),id), { method: "GET" });
            if(visit.ok) return new DOMParser().parseFromString(await visit.text(), "text/html");
            else throw new Error(visit.statusText);
        } catch (error) {
            console.error(error);
            return new Document();
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
            this.adjustments = array;
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
        this.appendedNotes = array;
        return array;
    }
    getDiagnosesFromVisit(visit = new Document()){
        const array = [];
        let code, description;
        visit.querySelectorAll("tbody#diagnosticList tr").forEach(tr => {
            [code, description] = tr.querySelectorAll("td");
            array.push({
                code: code.innerText,
                description: description.innerText
            });
        });
        this.diagnoses = array;
        return array;
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
        this.goals = obj;
        return obj;
    }
    getHistoryFromVisit(visit = new Document()){
        const obj = {}
        visit.querySelectorAll("#currentHxData textarea").forEach(el => {
            obj[el.name] = el.value;
        });
        this.history = obj;
        return obj;
    }
    getHomeInstructionsFromVisit(visit = new Document()){
        const array = [];
        let checkbox, label;
        visit.querySelectorAll("tbody#homeInstructionsTable tr").forEach(tr => {
            [checkbox, label] = tr.querySelectorAll("td");
            if(checkbox.checked) array.push(label);
        });
        this.homeInstructions = array;
        return array;
    }
    getMetaDataFromVisit(visit = new Document()){
        const head = visit.querySelector("#CompletedVisitData");
        if(head != null) {
            let [date, doctor] = head.innerText.split(/Completed\sVisit\s|\s\-\sby\s/gi).slice(1);
            let type;
            visit.querySelectorAll("tbody#visitsTable tr").forEach(tr => {
                let [visitDate, visitType] = tr.querySelectorAll("td");
                if(visitDate.innerText === date) type = /E/gi.test(visitType) ? "exam" : "visit";
            });
            return {
                date: (()=>{date = date.split(/\-/); return new Date(date[2], date[0], date[1])})(),
                type: type,
                doctor: typeof doctor === "string" ? `Dr. ${doctor}` : null
            }
        } else { return {date: null, doctor: null}; }
    }
    getNeuroFindingsFromVisit(visit = new Document()){
        let test;
        const array = [];
        visit.querySelectorAll("#pills-neurological tr").forEach(tr => {
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
        this.neuroFindings = array;
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
        this.orthoFindings = obj;
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
        this.palpatoryFindings = array;
        return array;
    }
    getProblemsFromVisit(visit = new Document()){
        const array = [];
        let problem, frequency, severity;
        visit.querySelectorAll("#progress tbody tr").forEach(tr => {
            [problem, frequency, severity] = tr.querySelectorAll("td").slice(1);
            array.push({
                name: problem.innerText,
                frequency: frequency.querySelector("select").value,
                severity: severity.querySelector("select").value
            });
        });
        this.problems = array;
        return array;
    }
    getReferralsFromVisit(visit = new Document()){
        const array = [];
        let date, location, doctor;
        visit.querySelectorAll("tbody#referalVisitTable tr").forEach(async tr => {
            let referral;
            [date, location, doctor] = tr.querySelectorAll("td");
            try{
                referral = await fetch(window.location.href.replace(window.location.pathname.split("/").at(-1),tr.dataset.visit_id), { method: "GET" });
                if(referral.ok) referral = new DOMParser().parseFromString(await referral.text(), "text/html");
                else throw new Error(referral.statusText);
            } catch (error) {
                console.error(error);
                return new Document();
            }
            let [type, reason] = referral.querySelectorAll("select[name=referral_notx], #reReason");
            array.push({
                visitId: tr.dataset.visit_id,
                date: date.innerText,
                location: location.innerText,
                doctor: doctor.innerText,
                type: type.value === "NT" ? "no treatment" : "referral",
                reason: reason.value,
            });
        });
        this.referrals = array;
        return array;
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
        this.romFindings = array;
        return array;
    }
    getTreatmentPlanFromVisit(visit = new Document()){
        const obj = {
            doctor: "",
            map: {}
        };
        let frequency, duration, doctor;
        visit.querySelectorAll("tbody#treatmentPlanDetails tr").forEach((tr, i) => {
            [frequency, duration, doctor] = tr.querySelectorAll("td");
            obj.map[i] = [frequency.innerText, duration.innerText];
            if(i === 0) obj.doctor = doctor.innerText;
        });
        return obj;
    }
    getVitalSignsFromVisit(visit = new Document()){
        const obj = new Vitals();
        visit.querySelectorAll("#pills-vitals-goals select, #pills-vitals-goals input").forEach(input => {
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
        this.vitalSigns = obj;
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
