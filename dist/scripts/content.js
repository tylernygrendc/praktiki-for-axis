function kebabCase(string){
    return string.split(/[A-Z]|_|\s/g).reduce((acc, cv, i, initialArray) => {
        return i < initialArray.length - 1 ? acc += `${cv.toLowerCase()}-`: acc += cv.toLowerCase();
    }, "");
}

class App {
    constructor(){
        this.log = [];
        this.name = null;
        this.resource = null;
        this.isBackOffice = false;
        this.isFrontOffice = false;
        switch(window.location.hostname){
            case "axis.thejoint.com": 
                this.name = "axis-front-office";
                this.resource = kebabCase(window.location.hash.split("/")[0].slice(1));
                this.isFrontOffice = true;
                break;
            case "backoffice.thejoint.com":
                this.name = "axis-back-office";
                this.resource = window.location.pathname.split("/")[1];
                this.isBackOffice = true;
                break;
        }
    }
    connectAlert(alert = new Snackbar()){

    }
    connectDialog(dialog = new Dialog()){

    }
    connectPopup(popup = new Dialog()){

    }
}

class User {
    constructor(){
        this.authorizedClinics = [];
        this.clinic = {
            id: null,
            name: null,
            address: {
                street: null,
                city: null,
                state: null,
                zip: null
            },
            phone: null,
            email: null,
            entity: null,
            company: null
        };
        this.credential = null; 
        this.currentApp = new App();
        this.email = null;
        this.id = null;
        this.isBetaUser = false;
        this.name = null;
        this.prefix = null;
        this.role = null;
        this.authToken = null;
        this.refreshToken = null;
        this.downloadToken = null;
        this.settings = {};
        this.username = null;
    }
    async initialize(){
        this.getUser()
            .getClinic()
            .getAuthorizedClinics();
        return this;
    }
    async getUser(){
        // set properties by application
        if(this.currentApp.isBackOffice){
            try{
                // get client nodes
                const authToken = document.querySelector("meta[name=csrf-token]");
                const profileNode = document.getElementById("navbarDropdown");
                // define user properties
                if(authToken != null) this.authToken = authToken.content;
                if(profileNode != null) {
                    this.credential = "DC";
                    this.name = profileNode.innerText.replace(/\s\W/g,"");
                    this.prefix = "Dr.";
                    this.role = "Doctor of Chiropractic";
                }
            } catch (error) {
                console.error(error);
            }
        } else if(this.currentApp.isFrontOffice){
            try{
                this.authToken = localStorage.getItem("prod:SugarCRM:AuthAccessToken");
                this.refreshToken = localStorage.getItem("prod:SugarCRM:AuthRefreshToken");
                this.downloadToken = localStorage.getItem("prod:SugarCRM:DownloadToken");

                const res = await fetch("https://axis.thejoint.com/rest/v11_24/me", {
                    method: "GET",
                    headers: {
                        "OAuth-Token": this.authToken
                    }
                });
                if(res.ok) {
                    res.json().then(json => {
                        this.name = json.current_user.full_name;
                        this.username = json.current_user.user_name;
                        if(/dr./i.test(this.username)) {
                            this.credential = "DC";
                            this.prefix = "Dr.";
                            this.role = "Doctor of Chiropractic";
                        } else {
                            this.role = "Wellness Coordinator";
                        }
                        this.id = json.current_user.id;
                        this.email = json.current_user.email.email_address;
                        this.clinic = {
                            id: json.current_user.clinic_id,
                            name: json.current_user.clinic_name
                        };
                        this.isBetaUser = json.current_user.beta_features;
                    });
                }
            } catch (error) {
                console.error(error);
            }
        }
    }
    async getClinic(id = this.clinic.id){
        if(this.currentApp.isFrontOffice){
            try{
                const response = await fetch(`https://axis.thejoint.com/rest/v11_24/TJ_Clinics/${id}?erased_fields=true&view=record`,{
                    method: "GET",
                    headers: { 
                        "Oauth-Token": this.authToken,
                    }
                });
                if(response.ok) {
                    response.json().then(json => {
                        this.clinic.name = json.name;
                        this.clinic.address.street = json.billing_address_street;
                        this.clinic.address.city = json.billing_address_city;
                        this.clinic.address.state = json.billing_address_state;
                        this.clinic.address.zip = json.billing_address_postalcode;
                        this.clinic.phone = json.phone1;
                        this.clinic.email = json.email;
                        this.clinic.company = json.pc;
                        if(json.business_entity) this.clinic.entity = json.business_entity;
                        // business is misspelled occasionally
                        if(json.bussiness_entity) this.clinic.entity = json.bussiness_entity;
                    });
                }
            } catch (error) {
                console.error(error);
            }
        } else if(this.currentApp.isBackOffice){
            try{
                const clinicNode = document.querySelectorAll(".navbar-nav.ms-auto .navbar-item")[1];
                if(clinicNode != null) this.clinic.name = clinicNode.innerText;
                // call google places api to get additional details ?
                // or scrape the joint website ?
            } catch (error) {
                console.error(error);
            }
        }
    }
    async getAuthorizedClinics(){
        try{
            const res = await fetch("https://axis.thejoint.com/rest/v11_24/Dashboards/enum/clinicslist", {
                method: "GET",
                headers: {
                    "OAuth-Token": this.authToken
                }
            });
            if(res.ok) {
                res.json().then(json => {
                    for(const [key, val] of Object.entries(json)){
                        this.authorizedClinics.push({
                            id: key,
                            name: val
                        });
                    }
                });
            }
        } catch (error){
            console.error(error);
        }
    }
}

const coerce = {
    array: (array, fallback = []) => {
        if(is.array(array)) return array;
        else return fallback;
    },
    boolean: (boolean, fallback = false) => {
        if(is.boolean(boolean)) return boolean;
        else return fallback;
    },
    element: (element, fallback = Element) => {
        if(is.element(element)) return element;
        else return fallback;
    },
    function: (f, fallback = function(){}) => {
        if(is.function(f)) return f;
        else return fallback;
    },
    number: (number = 0, fallback = 0) => {
        if(is.number(number)) return number;
        else return fallback;
    },
    object: (object = {}, fallback = {}) => {
        if(is.object(object)) return object;
        else return fallback;
    },
    string: (string = "", fallback = "") => {
        if(is.string(string)) return string;
        else return fallback;
    }
};
const is = {
    array: (thing) => {
        if(Array.isArray(thing)) return true;
        else return false;
    },
    boolean: (thing) => {
        if(typeof thing === "boolean") return true;
        else return false;
    },
    element: (thing) => {
        if(thing instanceof Element) return true;
        else return false;
    },
    function: (thing) => {
        if(typeof thing === "function") return true;
        else return false;
    },
    null: (thing) => {
        if(thing === null) return true;
        else return false;
    },
    number: (thing) => {
        if(typeof thing === "number") return true;
        else return false;
    },
    object: (thing) => {
        if(typeof thing === "object" && !Array.isArray(thing) && thing != null) return true;
        else return false;
    },
    string: (thing) => {
        if(typeof thing === "string") return true;
        else return false;
    },
    undefined: (thing) => {
        if(thing === undefined) return true;
        else return false;
    }
};

new Date(new Date().setHours(23,59,59));
new Date(new Date().setHours(0,0,0));
new Date(new Date().getFullYear(),11,31,23,59,59);
new Date(new Date().getFullYear(),0,1);

// import { PDFParse } from "pdf-parse";
class BackOfficePatient {
    constructor(user = new User(), docRef = document){
        // document reference
        this.docRef = docRef;
        // user reference
        this.user = user;
        // patient id
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
        };
        this.documentMap = {};
        // progress tracking
        this.plan = {
            start: null,
            end: null,
            frequency: [],
            usedVisits: null,
            weeksRemaining: null,
        };
        this.previousExam = {
            day: null,
            date: null,
            daysSince: null,
            note: null
        };
        this.previousVisit = {
            day: null,
            date: null,
            daysSince: null,
            note: null
        };
        this.problemHistory = {
            reason: null,
            problemList: [],
            onset: null,
            disability: [],
            goals: [],
            previousProviders: []
        };
        // business
        this.product = {
            type: null,
            cycleDate: null,
            hasBalance: null,
            balanceDue: 0,
            visitsUsed: null,
            visitsRemaining: null,
            pendingCancellation: null
        };
        // scrape axis for information (synchronous)
        this.getInformationFromSidebar(docRef);
        this.getAreasOfConcern(docRef);
        this.getDocumentMap(docRef);
        this.getGeneralNotes(docRef);
        this.getIntake(docRef);
    }
    async getPatientById(patientId = "", visitId = ""){
        try{
            let res = await fetch(`https://backoffice.thejoint.com/get-patient/${patientId}/${visitId}`, {
                "method": "GET",
                "headers": {
                    "x-csrf-token": this.user.authToken
                }
            });
            if(res.ok) res = await res.json();
            else throw new Error(res.statusText);
            this.id = res.search_patients.id;
            this.phone = res.search_patients.phone_mobile;
            // flags
            this.hasABNDue = res.search_patients.abn_c ? true : false;
            this.hasDoNotAdjust = res.search_patients.has_do_not_adjust ? true : false;
            this.hasFormsDue = res.search_patients.needs_forms_c ? true : false;
            this.hasOpenTask = res.search_patients.ot ? true : false;
            this.hasPaymentDue = res.search_patients.pay_flag ? true : false;
            this.hasSeeNotesFlag = res.search_patients.see_notes ? true : false;
            this.isMedicareEligible = res.search_patients.ismedicareeligible_c ? true : false;
            this.isMilitary = res.search_patients.is_military ? true : false;
            this.isNewPatient = res.search_patients.new_patient_flag_c ? true : false;
            this.product.type = res.search_patients.producttype_c;
            // previous visit
            this.previousVisit.date = new Date(res.search_patients.lastvisitdate_c);
            this.previousVisit.doctor = `Dr. ${res.search_patients.last_dc_name}`;
            this.previousVisit.id = res.search_patients.lastvisitid_c;
            // product
            this.product.cycleDate = res.search_patients.recurringday;
            this.product.visitsRemaining = res.search_patients.rpv_c;
            this.product.hasBalance = res.search_patients.pay_flag ? true : false;
            this.product.balanceDue = res.search_patients.balance;
            this.product.careCardsRemaining = res.search_patients.carecard_c;
            this.product.homeClinic = res.search_patients.tj_clinics_contacts_1_name;
        } catch (error) {
            console.error(error);
        } finally {
            return this;
        }
    }
    async getPatientBySearch(fname = this.fname, lname = this.lname, dob = this.dob, phone = this.phone){
        try{
            let res = await fetch("https://backoffice.thejoint.com/patient-search", {
                "body": `first_name=${fname}]&last_name=${lname}&dob=${dob}&phone=${phone}`,
                "method": "POST",
                "headers": {
                    "x-csrf-token": this.user.authToken
                }
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
        this.areasOfConcern = coerce.element(docRef.querySelector("textarea[name=spinal_concern_c]")).value;
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
        this.generalNotes = coerce.element(docRef.querySelector("textarea#generalNotes")).value;
        return this;
    }
    getIntake(docRef = document){
        // get doctor comments from intake
        this.intake.comments = coerce.element(docRef.querySelector("#pills-beta_patient_hx textarea#dc_notes")).value;
        // get pregnancy due date from intake
        this.intake.pregnancyDueDate = coerce.element(docRef.querySelector("#pregnancy_due_date")).value;
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
                    else if(/other\W/gi.test(input.name)) this.intake.medicalHistory.list.push(coerce.element(docRef.querySelector("#pills-beta_patient_hx textarea[name=callergiesdesc]")).value);
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
                const array = coerce.element(div.parentElement.querySelector("textarea")).value.split(/\s\-\s|\n/gi);
                for(let i = 0; i < array.length; ++i) Object.assign(this.intake[prop]["list"],{[array[i]]:array[++i]});
            }
        });
        // get medication list from intake
        docRef.querySelectorAll("input[name=currentprescription]").forEach(input => {
            if(input.checked) this.intake.medicationHistory.exists = true;
        });
        this.intake.medicationHistory.list = String(coerce.element(docRef.querySelector("textarea[name=prescripyes]")).value)
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
    async getPreviousExam(){
        this.id;
    }
    async getPreviousVisit(){
        this.id;
    }
    async getPreviousExamAndVisit(docRef = this.docRef){
        // get most recent visit and exam
        docRef.querySelectorAll("tbody#visitsTable tr").forEach(async (tr, i) => {
            if(i === 0) this.previousVisit.note = await new BackOfficeVisit(tr.dataset.visit_id).initialize();
            if(/E/gi.test(tr.querySelectorAll("td")[1].innerText) && this.previousExam.date === null) {
                this.previousExam.note = await new BackOfficeVisit(tr.dataset.visit_id).initialize();
            }
        });
        return this;
    }
}
class BackOfficeVisit {
    constructor(patientId = "", visitId = ""){
        this.id = visitId;
        this.clinic = "";
        this.doctor = "";
        this.date = null;
        this.day = null;
        this.patient = {
            id: patientId,
            name: "",
            fname: "",
            lname: "",
            initials: "",
            finitial: "",
            linitial: "",
            dob: null,
            age: 0,
            sex: ""
        };
        this.adjustments = [];
        this.appendedNotes = [];
        this.diagnoses = [];
        this.goals = {};
        this.history = {};
        this.homeInstructions = [];
        this.neuroFindings = [];
        this.orthoFindings = [];
        this.palpatoryFindings = [];
        this.problems = [];
        this.referrals = [];
        this.romFindings = [];
        this.treatmentPlan = [];
        this.vitalSigns = [];
    }
    async initialize(){
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
        return this;
    }
    async getVisitById(id = this.id){
        try{
            const visit = await fetch(window.location.href.replace(window.location.pathname.split("/").at(-1),id), {
                method: "GET",
                headers: {
                    "x-csrf-token": this.user.authToken
                }
            });
            if(visit.ok) return new DOMParser().parseFromString(await visit.text(), "text/html");
            else throw new Error(visit.statusText);
        } catch (error) {
            console.error(error);
            return new Document();
        }
    }
    getAdjustmentsFromVisit(visit = new Document()){
        this.adjustments = [];
        visit.querySelectorAll("#spinalAdj td button, #extremetiesAdj td button").forEach(button => {
            if(button.value != "Do Not Adjust") this.adjustments.push(new Adjustment(button.name, button.value));
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
        visit.querySelectorAll("tbody#diagnosticList tr td").forEach((td, i) => {
           if(!(i % 2)) this.diagnoses.push(new Diagnosis(td.innerText));
        });
        return this;
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
        const obj = {};
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
                this.date = (()=>{date = date.split(/\-/); return new Date(date[2], date[0], date[1])})();
                this.type = type;
                this.doctor = typeof doctor === "string" ? `Dr. ${doctor}` : null;
            }
    }
    getNeuroFindingsFromVisit(visit = new Document()){
        visit.querySelectorAll("#pills-neurological table tbody tr td button").forEach(button => {
            this.neuroFindings.push(new NeurologicTest(button.name, button.value));
        });
        return this;
    }
    getOrthoFindingsFromVisit(visit = new Document()){
        visit.querySelectorAll("#pills-orthopedic table tbody tr td button:not(.document-nuances)").forEach(button => {
            this.orthoFindings.push(new OrthopedicTest(button.name, button.value));
        });
        return this;
    }
    getPalpatoryFindingsFromVisit(visit = new Document()){
        this.palpatoryFindings = [];
        visit.querySelectorAll("#palpatoryAdj tr button.multiState").forEach(button => {
            this.palpatoryFindings.push(new BackSpasm(button.name, button.value));
        });
    }
    getProblemsFromVisit(visit = new Document()){
        visit.querySelectorAll("#progress tbody tr").forEach(tr => {
            const [problem, frequency, severity] = tr.querySelectorAll("td").slice(1);
            this.problems.push({
                name: problem.innerText,
                frequency: frequency.querySelector("select").value,
                severity: severity.querySelector("select").value
            });
        });
        return this;
    }
    getReferralsFromVisit(visit = new Document()){
        const array = [];
        let date, location, doctor;
        visit.querySelectorAll("tbody#referalVisitTable tr").forEach(async tr => {
            let referral;
            [date, location, doctor] = tr.querySelectorAll("td");
            try{
                referral = await fetch(window.location.href.replace(window.location.pathname.split("/").at(-1),tr.dataset.visit_id), { 
                    method: "GET",
                    headers: {
                        "x-csrf-token": this.user.authToken
                    }
                });
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
        // reset ROM findings
        this.romFindings = [];
        // get spinal findings from table
        visit.querySelectorAll("#pills-rom #romCervicalLumbar table tbody").forEach((table, i) => {
            const test = new MotionTest(["cervical region","lumbar region"][i]);
            table.querySelectorAll("tr").forEach(tr => {
                const [normal, restriction, pain] = tr.querySelectorAll("button");
                test.addFinding(normal.name, restriction.value, pain.value);
            });
            this.romFindings.push(test);
        });
        // get extremity findings from table
        visit.querySelectorAll("table.upperLower tbody tr").forEach(tr => {
            const [restriction, pain] = tr.querySelectorAll("td button");
                new MotionTest((() => {
                    switch(restriction.name.replaceAll(/[lr]_(pal|ran)|_c/gi,"")){
                        case "tmj":
                            return "temporomandibular joint";
                        case "shouldr":
                            return "glenohuermal joint";
                        case "elbow":
                            return "elbow"
                        case "wrist":
                            return "wrist";
                        case "sc":
                            return "sternoclavicular joint";
                        case "acl":
                            return "acromioclavicular joint";
                        case "ribs":
                            return "ribs";
                        case "hip":
                            return "hip";
                        case "knee":
                            return "knee";
                        case "ankle":
                            return "ankle";
                        default:
                            return restriction.name;
                    }
                })(), /l_pal/gi.test(restriction.name) ? "left" : "right").addFinding(restriction.name,restriction.value, pain.value);
                this.romFindings.push(test);
        });
        return this.romFindings;
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
        this.vitalSigns = new Vitals();
        visit.querySelectorAll("#pills-vitals-goals select, #pills-vitals-goals input").forEach(input => {
            if(/systolic|diastolic|location/gi.test(input.name)){
                this.vitalSigns.blood.bloodPressure[input.name.split(/_c/gi)[0]] = input.value;
            } else if(/reading[ft]/gi.test(input.name)){
                this.vitalSigns.temperature[input.name.split(/reading|_c/gi)[1]] = input.value;
            } else if(/height/gi.test(input.name)){
                this.vitalSigns.height[input.name.split(/height|_c/gi)[1]] = input.value;
            } else if(/weight/gi.test(input.name)){
                if(/report/gi.test(input.name)) this.vitalSigns.weight.source = input.value;
                else this.vitalSigns.weight.lbs = input.value;
            } else if(/pulse|reading/gi.test(input.name)){
                switch(input.name){
                    case "pulseside_c":
                        this.vitalSigns.pulse.side = input.value;
                        break;
                    case "pulsepart_c":
                        this.vitalSigns.pulse.site = input.value;
                        break;
                    case "reading_c":
                        this.vitalSigns.pulse.rate = input.value;
                        break;
                }
            } else if(/rrate|measured/gi.test(input.name)){
                if(input.name === "rrate_c") this.vitalSigns.respiration.rate = input.value;
                else if(input) this.vitalSigns.respiration.position = input.value;
            }
        });
        return this;
    }
}
class Adjustment {
    constructor(segment = "", method = ""){
        this.axisRef = segment;
        this.contactPoint = null;
        this.lineOfCorrection = null;
        this.listing = null;
        this.malposition = "";
        this.method = method;
        this.region = (() => {
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
        })();
        this.restriction = "";
        this.segment = segment.replaceAll(/^[rl]|spinal_|_c|[rl]$/gi,"");
        if(/[ctl][0-9]/gi.test(this.segment)) this.segment = this.segment.toUpperCase();
        this.segmentalContactPoint = null;
        this.side = (() => {
            const side = segment.replaceAll(/spinal_|_c/gi,"").match(/[rl]$|[lr](pelvis|sacrum)/gi);
            if(side === null) return "";
            else if(side[0] === "r") return "right";
            else if(side[0] === "l") return "left";
        })();
        this.technique = "diversified";
        this.type = /[ctl][0-9]|rib|pelvis|sacrum/gi.test(segment) ? "spinal" : "extremity";
    }
    get abbreviation(){
        switch(this.segment){
            case "pelvis":
                return `${this.side.at(0)}IL`.toUpperCase();
            case "sternoclavicular":
                return `${this.side.at(0)}SC`;
            case "glenohumeral":
                return `${this.side.at(0)}SH`;
            case "acromioclavicular":
                return `${this.side.at(0)}AC`;
            case "hip":
                return `${this.side.at(0)}HIP`;
            default:
                if(/[ctl][0-9]/gi.test(this.segment)) return this.segment;
                else return this.segment.substring(0,2).toUpperCase();
        }
    }
}
class BackSpasm{
    constructor(site = "", severity = "", side = ""){
        this.axisRef = site;
        this.severity = (() => {
            switch(severity){
                case 0:
                case "0":
                case "":
                    return "";
                case 1:
                case "1":
                case "mild":
                    return "mild";
                case 2:
                case "2":
                case "moderate":
                    return "moderate";
                case 3:
                case "3":
                case "severe":
                    return "severe";
                default:
                    return severity ? severity : "";
            }
        })();
        this.side = side ? side : (() => {
            const array = site.match(/[lr](?!vi|um)/gi);
            if(array != null){
                switch(array[0]){
                    case "l":
                    case "_l":
                        return "left";
                    case "r":
                    case "_r":
                        return "right";
                }
            }
        })();
        this.site = site.replaceAll(/[lr](?!vi|um)|_[lr]|_c/gi,"");
    }
}
class Diagnosis {
    constructor(code = ""){
        
    }
}
class MotionTest {
    constructor(name = "", side = ""){
        name = name.split(/\s(region|joint|spine)/gi)[0];
        this.isSided = side ? true : false;
        this.name = name[0];
        this.side = side;
        this.type = arr[1] ? ["region", "joint", "spine"].includes(name[1]) ? name[1] : "" : "";
        this.result = typeof this[`#${name}`] === "function" ? this[name]() : {};
        for(const key of Object.keys(this.result)){
            Object.append(this.result[key], {
                measuredDegrees: null,
                isPainful: null,
                painSeverity: "",
                isRestricted: null,
                restrictionSeverity: "",
                axisPainRef: "",
                axisRestrictionRef: ""
            });
        }
    }
    get isRestricted(){
        return Object.values(this.result).some((value => {value.isRestricted === true;}));
    }
    get isPainful(){
        return Object.values(this.result).some((value => {value.isPainful === true;}));
    }
    addFinding(range = "", restriction = "", pain = ""){
        const axisRef = {
            pain: range.replace(/norm$|rest$/gi,"pain"),
            restriction: range.replace(/norm$|pain$/gi,"rest")
        };
        switch(range.replaceAll(/^[cl]|norm|rest|pain|[lr]_ran|[lr]_pal|_c/gi,"")){
            case "flex":
                range = "flexion";
                break;
            case "ext":
                range = "extension";
                break;
            case "flexl":
                range = "leftLateralFlexion";
                break;
            case "flexr":
                range = "rightLateralFlexion";
                break;
            case "rotl":
                range = "leftRotation";
                break;
            case "rotr":
                range = "rightRotation";
                break;
            case "tmj":
            case "shouldr":
            case "elbow":
            case "wrist":
            case "sc":
            case "ac":
            case "ribs":
            case "hip":
            case "knee":
            case "ankle":
                range = "joint";
                break;
        }
        for(const [key, value] of Object.entries(axisRef)){
            this.result[range][`${key}Ref`] = value;
        }
        if(restriction) switch(restriction){
            case 1:
            case "1":
            case "mild":
                this.result[range].isRestricted = true;
                this.result[range].restrictionSeverity = "mild";
                break;
            case 2:
            case "2":
            case "moderate":
                this.result[range].isRestricted = true;
                this.result[range].restrictionSeverity = "moderate";
                break;
            case 3:
            case "3":
            case "severe":
                this.result[range].isRestricted = true;
                this.result[range].restrictionSeverity = "severe";
                break;
            default:
                this.result[range].isRestricted = false;
                this.result[range].restrictionSeverity = restriction ? restriction : "";
                break;
        }
        if(pain) switch(pain){
            case 1:
            case "1":
            case "mild":
                this.result[range].isPainful = true;
                this.result[range].painSeverity = "mild";
                break;
            case 2:
            case "2":
            case "moderate":
                this.result[range].isPainful = true;
                this.result[range].painSeverity = "moderate";
                break;
            case 3:
            case "3":
            case "severe":
                this.result[range].isPainful = true;
                this.result[range].painSeverity = "severe";
                break;
            default:
                this.result[range].isPainful = false;
                this.result[range].painSeverity = pain ? pain : "";
                break;
        }
        return this;
    }
    #cervical(){
        return {
            flexion: {
                normalDegrees: 60
            },
            extension: {
                normalDegrees: 75
            },
            leftRotation: {
                normalDegrees: 80
            },
            rightRotation: {
                normalDegrees: 80
            },
            leftLateralFlexion: {
                normalDegrees: 45
            },
            rightLateralFlexion: {
                normalDegrees: 45
            }
        };
    }
    #thoracic(){
        return {
            flexion: {
                normalDegrees: 50
            },
            extension: {
                normalDegrees: 25
            },
            leftRotation: {
                normalDegrees: 30
            },
            rightRotation: {
                normalDegrees: 30
            },
            leftLateralFlexion: {
                normalDegrees: 25
            },
            rightLateralFlexion: {
                normalDegrees: 25
            }
        };
    }
    #lumbar(){
        return {
            flexion: {
                normalDegrees: 50
            },
            extension: {
                normalDegrees: 25
            },
            leftRotation: {
                normalDegrees: 30
            },
            rightRotation: {
                normalDegrees: 30
            },
            leftLateralFlexion: {
                normalDegrees: 25
            },
            rightLateralFlexion: {
                normalDegrees: 25
            }
        };
    }
    #shoulder(){
        return {
            flexion: {
                normalDegrees: 180
            },
            extension: {
                normalDegrees: 50
            },
            abduction: {
                normalDegrees: 180
            },
            adduction: {
                normalDegrees: 50
            },
            internalRotation: {
                normalDegrees: 90
            },
            externalRotation: {
                normalDegrees: 90
            }
        };
    }
    #elbow(){
        return {
            flexion: {
                normalDegrees: 140
            },
            extension: {
                normalDegrees: 0
            }
        };
    }
    #forearm(){
        return {
            pronation: {
                normalDegrees: 80
            },
            supination: {
                normalDegrees: 80
            }
        };
    }
    #wrist(){
        return {
            flexion: {
                normalDegrees: 60
            },
            extension: {
                normalDegrees: 60
            },
            ulnarDeviation: {
                normalDegrees: 20
            },
            radialDeviation: {
                normalDegrees: 20
            }
        };
    }
    #hip(){
        return {
            flexion: {
                normalDegrees: 100
            },
            extension: {
                normalDegrees: 30
            },
            abduction: {
                normalDegrees: 40
            },
            adduction: {
                normalDegrees: 20
            },
            internalRotation: {
                normalDegrees: 40
            },
            externalRotation: {
                normalDegrees: 50
            }
        };
    }
    #knee(){
        return {
            flexion: {
                normalDegrees: 150
            },
            extension: {
                normalDegrees: 0
            }
        };
    }
    #ankle(){
        return {
            plantarflexion: {
                normalDegrees: 40
            },
            dorsiflexion: {
                normalDegrees: 30
            }
        };
    }
}
class NeurologicTest {
    constructor(name = "", side = ""){
        this.axisRef = name;
        this.name = name.replaceAll(/(?<!othe)[rl]$|[rl]_c|_[lmr]|_[0-9]+/gi,"");
        if(typeof this[`#${this.name}`] === "function") Object.assign(this, this[`#${this.name}`]());
        this.side = side ? side : (() => {
            switch(this.axisRef.match(/(?<!othe)[rl]$|[rl]_c|_[lmr]|_[0-9]+/gi,"")){
                case "l":
                    return "left";
                case "r":
                    return "right";
                default:
                    return "";
            }
        })();
    }
    get isPositive(){
        return Object.values(this.result).some((value => {value.isPositive === true;}));
    }
    addFinding(isPositive = null, description = []){
        this.result = {
            isPositive : typeof isPositive === "boolean" ? isPositive : null,
            description: typeof description === "object" ? description : [description]
        };
        return this;
    }
    placeholder(){
        return {
            name: "Placeholder",
            region: "lower extremity", // upper extremity
            position: "seated", // prone, supine
            type: "sensory", // reflex, strength
            for: [],
            purpose: "",
            description: "",
            positive: {
                "": []
            }
        }
    }
}
class OrthopedicTest{
    constructor(name = "", side = ""){
        this.axisRef = name;
        this.name = name.replaceAll(/[rl]$|[rl]_c|_[lmr]|_[0-9]+/gi,""); // ! update to match axis
        if(typeof this[`#${this.name}`] === "function") Object.assign(this, this[`#${this.name}`]());
        else Object.assign(this, this.#lookup(this.name));
        this.side = side ? side : (() => {
            switch(this.axisRef.match(/(?<!othe)[rl]$|[rl]_c|_[lmr]|_[0-9]+/gi,"")){ // ! update to match axis
                case "l":
                    return "left";
                case "r":
                    return "right";
                default:
                    return "";
            }
        })();
    }
    get isPositive(){
        return Object.values(this.result).some((value => {value.isPositive === true;}));
    }
    addFinding(isPositive = null, description = []){
        this.result = {
            isPositive : typeof isPositive === "boolean" ? isPositive : null,
            description: typeof description === "object" ? description : [description]
        };
        return this;
    }
    #lookup(testName = ""){
        switch(testName = ""){
            case "Wright's Test":
                return {

                }
            case "Adson's Test":
                return {

                }
        }
    }
    #maxcom(){
        return {
            name: "Maxium Cervical Compression Test",
            region: "cervical",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: ["Spurling's Test","foraminal compression test","cervical compression test"],
            purpose: "Assess nerve root compression in the neck.",
            description: "Apply axial compression with the neck in combined roation, extension, and lateral flexion.",
            sensitivity: 0.50,
            specificity: 0.88,
            positive: {
                "increased localized pain": ["M47.812","M47.813"],
                "radiating pain": ["M54.12","M54.13","M47.22","M47.23"]
            }
        }
    }
    #shldrdepr(){
        return {
            name: "Shoulder Depression Test",
            region: "cervical",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: ["cervical quadrant test"],
            purpose: "Assess nerve root compression in the neck.",
            description: "Apply downward pressure on the shoulder holding the neck in opposite side lateral flexion.",
            sensitivity: 0.50,
            specificity: 0.88,
            positive: {
                "increased localized pain": ["M47.812","M47.813"],
                "paresthesia": ["S14.3","G54.0","M54.12","M54.13","M47.22","M47.23"]
            }
        }
    }
    #bakody(){
        return {
            name: "Bakody Test",
            region: "cervical",
            position: "seated",
            type: "paliative",
            for: [],
            altNames: ["shoulder abduction test"],
            purpose: "Assess nerve root compression in the neck.",
            description: "Instruct patient to place the palm of the affected side flat on top of their head.",
            sensitivity: 0.50,
            specificity: 0.88,
            positive: {
                "decreased radiating pain": ["M54.12","M47.22","M50.121","M50.122","M50.123"],
            }
        }
    }
    #jackcom(){
        return {
            name: "Eden's Test",
            region: "cervical",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: ["costoclavicular test","Military Brace Test"],
            purpose: "Assess costoclavicular compression of the neurovascular bundle.",
            description: "Palpate the radial pulse as the patient forces their shoulders back and tucks their chin.",
            sensitivity: null,
            specificity: null,
            positive: {
                "increased pain": ["G54.0"],
                "increased paresthesia": ["G54.0"], 
                "diminished pulse": ["G54.0"]
            }
        }
    }
    #valsava(){
        return {
            name: "Valsalva Test",
            region: "cervical",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: ["valsalva maneuver"],
            purpose: "Assess nerve root compression in the neck.",
            description: "Instruct patient to take a deep breath and hold while bearing down.",
            sensitivity: 0.22,
            specificity: 0.94,
            positive: {
                "increased radiating pain": ["M50.121","M50.122","M50.123"]
            }
        }
    }
    #adam(){
        return {
            name: "Adam's Test",
            region: "thoracic",
            position: "standing",
            type: "functional",
            for: [],
            altNames: ["forward bend test"],
            purpose: "Distinguish structural and functional scoliosis.",
            description: "Observe spinal curvature (scoliosis) as the patient bends forward.",
            sensitivity: 0.84,
            specificity: 0.93,
            positive: {
                "increased scoliosis in flexion": ["M41.8"],
                "unchanged scoliosis during flexion": ["M41.2"]
            }
        }
    }
    #schep(){
        return {
            name: "Schepelmann Test",
            region: "thoracic",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: [],
            purpose: "Assess intercostal neuritis.",
            description: "Instruct patient to laterally flex the trunk with arms raised overhead.",
            sensitivity: null,
            specificity: null,
            positive: {
                "increased pain on the concave side": ["G58"],
                "increased pain on the convex side": ["R09.1"]
            }
        }
    }
    #slr(){
        return {
            name: "Straigh Leg Raise Test",
            region: "lumbar",
            position: "supine",
            type: "provocative",
            for: [],
            altNames: [],
            purpose: "Assess lumbosacral radicuolopathy.",
            description: "Raise the patient's leg to 90 degrees, or to the point of pain.",
            sensitivity: 0.67,
            specificity: 0.26,
            positive: {
                "increased pain before 70 degrees flexion": ["M51.17","M54.3","M54.4","G57.0"],
                "increased pain after 70 degrees flexion": ["M62.89"]
            }
        }
    }
    #brag(){
        return {
            name: "Bragard's Test",
            region: "lumbar",
            position: "supine",
            type: "provocative",
            for: [],
            altNames: [],
            purpose: "Assess lumbosacral radicuolopathy.",
            description: "Raise the patient's leg to the point of pain and sharply dorsiflex the foot.",
            sensitivity: 0.67,
            specificity: 0.26,
            positive: {
                "increased radiating pain": ["M51.17","M54.3","M54.4","G57.0"]
            }
        }
    }
    #kemp(){
        return {
            name: "Kemp's Test",
            region: "lumbar",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: ["quadrant test","extension-rotation test"],
            purpose: "Assess lumbosacral radicuolopathy.",
            problems: ["sciatica"],
            description: "Apply oblique pressure at the shoulder to extend and rotate the lumbar spine while stabilizing the opposite hip.",
            sensitivity: 0.60,
            specificity: 0.67,
            positive: {
                "increased localized pain": ["M47.816","M47.817"],
                "radiating pain": ["M51.17","M47.26","M47.27"]
            }
        }
    }
    #elys(){
        return {
            name: "Ely's Test",
            region: "hip",
            position: "prone",
            type: "functional",
            for: [],
            altNames: ["Duncan-Ely Test"],
            purpose: "Assess hip flexor flexibility.",
            description: "Observe for resistance or lifting of the hip while passively flexing the knee.",
            sensitivity: 0.67,
            specificity: 1.00,
            positive: {
                "resistance against flexion": ["M24.55"],
                "lifting of the buttock or hip": ["M24.55"]
            }
        }
    }
    #gold(){
        return {
            name: "Goldthwait Test",
            region: "lumbar",
            position: "supine",
            type: "provocative",
            for: [],
            altNames: [],
            purpose: "Distinguish lumbosacral and sacroiliac origin.",
            description: "Palpate the lumbar spinouses while performing a straight leg raise.",
            sensitivity: null,
            specificity: null,
            positive: {
                "pain before lumbar movement": [],
                "pain after lumbar movement": []
            }
        }
    }
    #anvil(){
        return {
            name: "Anvil Test",
            region: "hip",
            position: "supine",
            type: "provocative",
            for: [],
            altNames: [],
            purpose: "Assess hip integrity.",
            description: "Forcefully strike the calcaneous while elevating the leg.",
            sensitivity: 0.57,
            specificity: 0.74,
            positive: {
                "localized pain in hip": ["S72.9"]
            }

        }
    }
    #hibs(){
        return {
            name: "Hibb's Test",
            region: "hip",
            position: "prone",
            type: "provocative",
            for: [],
            altNames: [],
            purpose: "Distingush sacroiliac and hip origin.",
            description: "Internally rotate the hip during full knee flexion.",
            sensitivity: null,
            specificity: null,
            positive: {
                "increased back pain": [],
                "increased hip pain": []
            }
        }
    }
    #fabre(){
        return {
            name: "FABER Test",
            region: "hip",
            position: "prone",
            type: "provocative",
            for: [],
            altNames: ["Patrick's Test"],
            purpose: "Assess hip involvement.",
            description: "Extend the hip while in flexion, abduction, and external rotation.",
            sensitivity: 0.89,
            specificity: 0.54,
            positive: {
                "increased sacroiliac pain": [],
                "increased hip pain": []
            }
        }
    }
    #yeaoman(){
        return {
            name: "Yeoman's Test",
            region: "hip",
            position: "prone",
            type: "provocative",
            for: [],
            altNames: [],
            purpose: "Assess sacroiliac involvement.",
            description: "Hyperextend the hip during full knee flexion.",
            sensitivity: 0.64,
            specificity: 0.33,
            positive: {
                "increased pain at the sacroiliac joint": ["S33.6"]
            }
        }
    }
    #trend(){
        return {
            name: "Trendelenburg Test",
            region: "hip",
            position: "standing",
            type: "functional",
            for: [],
            altNames: [],
            purpose: "Assess hip abductor strength.",
            description: "Observe hip level while the patient stands on one leg.",
            sensitivity: null,
            specificity: null,
            positive: {
                "inability to maintain level pelvis": []
            }
        }
    }
    #neers(){
        return {
            name: "Neer Test",
            region: "shoulder",
            position: "standing",
            type: "provocative",
            for: [],
            altNames: [],
            purpose: "Assess subacromial impingement.",
            description: "Move the shoulder to end-range flexion.",
            sensitivity: 0.72,
            specificity: 0.60,
            positive: {
                "increased shoulder pain": ["M75.4"]
            }
        }
    }
    #supras(){
        return {
            name: "Supraspinatus Test",
            region: "shoulder",
            position: "standing",
            type: "provocative",
            for: [],
            altNames: ["empty can test", "Jobe Test"],
            purpose: "Assess supraspinatus (rotator cuff) lesion.",
            description: "Apply resitance agaist shoulder flexion during maximum forearm pronation.",
            sensitivity: 0.50,
            specificity: 0.89,
            positive: {
                "increased shoulder pain": ["M75.4"]
            }
        }
    }
    #infras(){
        return {
            name: "Infraspinatus Test",
            region: "shoulder",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: [],
            purpose: "Assess infraspinatus (rotator cuff) lesion.",
            description: "Apply resitance agaist shoulder external rotation.",
            sensitivity: 0.90,
            specificity: 0.74,
            positive: {
                "increased shoulder pain": ["M75.1","S46.0"]
            }
        }
    }
    #extrot(){
        return {
            name: "External Rotation Lag Test",
            region: "shoulder",
            position: "standing",
            type: "functional",
            for: [],
            altNames: ["spring back test"],
            purpose: "Assess supraspinatus and infraspinatus (rotator cuff) lesions.",
            description: "The patient attempts to maintain external shoulder rotation.",
            sensitivity: 0.97,
            specificity: 0.93,
            positive: {
                "cannot perform motion": ["M75.1","S46.0"]
            }
        }
    }
    #dropa(){
        return {
            name: "Drop Arm Test",
            region: "shoulder",
            position: "standing",
            type: "functional",
            for: [],
            altNames: [],
            purpose: "Assess supraspinatus (rotator cuff) tear.",
            description: "The patient slowly lowers their arm in abduction.",
            sensitivity: 0.73,
            specificity: 0.77,
            positive: {
                "cannot perform motion": ["M75.1","S46.0"]
            }
        }
    }
    #bellp(){
        return {
            name: "Belly Press Test",
            region: "shoulder",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: ["lift-off test (variation)"],
            purpose: "Assess subscapularis (rotator cuff) lesion.",
            description: "The patient presses their hand against their abdomen.",
            sensitivity: 0.34,
            specificity: 0.96,
            positive: {
                "increased pain": ["M75.1","S46.0"]
            }
        }
    }
    #kimt(){
        return {
            name: "Kim Test",
            region: "shoulder",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: [],
            purpose: "Assess inferior labral lesion.",
            description: "Apply downward loading to the arm while at 90 degrees shoulder abduction.",
            sensitivity: 0.80,
            specificity: 0.94,
            positive: {
                "increased shoulder pain": ["M75.8","S43.43"]
            }
        }
    }
    #jerkt(){
        return {
            name: "Kim Test",
            region: "shoulder",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: [],
            purpose: "Assess posterior labral lesion.",
            description: "Move the arm to midline under proximal compression while at 90 degrees abduction.",
            sensitivity: 0.73,
            specificity: 0.98,
            positive: {
                "increased posterior shoulder pain": ["M75.8","S43.43"],
                "palpable posterior clunk": ["M75.8","S43.43"]
            }
        }
    }
    #actcomp(){
        return {
            name: "Active Compression Test",
            region: "shoulder",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: ["O'Briens Test"],
            purpose: "Assess superior labral lesion.",
            description: "Apply downard loading to the pronated forearm while at 90 degrees shoulder flexion.",
            sensitivity: 0.50,
            specificity: 0.80,
            positive: {
                "increased deep shoulder pain": ["M75.8","S43.43"],
                "palpable clunk": ["M75.8","S43.43"],
                "pain at the acromioclvicular joint": ["S43.5"]
            }
        }
    }
    #appt(){
        return {
            name: "Apprehension Test",
            region: "shoulder",
            position: "supine",
            type: "provocative",
            for: [],
            altNames: [],
            purpose: "Assess anterior shoulder instability.",
            description: "Observe the patient during passive shoulder abduction and external rotation.",
            sensitivity: 0.53,
            specificity: 0.99,
            positive: {
                "patient apprehnesion or alarm": ["M25.31"]
            }
        }
    }
    #cozen(){
        return {
            name: "Cozen's Test",
            region: "elbow",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: ["resisted wrist extension test","tennis elbow test"],
            purpose: "Assess lateral epicondylalgia.",
            description: "Apply resistive force against wrist extension.",
            sensitivity: 0.91,
            specificity: null,
            positive: {
                "pain at the lateral epicondyle": ["M77.1"]
            }
        }
    }
    #golfe(){
        return {
            name: "Golfer's Elbow Test",
            region: "elbow",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: ["resisted wrist flexion test"],
            purpose: "Assess medial epicondylalgia.",
            description: "Apply resistive force against wrist flexion.",
            sensitivity: null,
            specificity: null,
            positive: {
                "pain at the medial epicondyle": ["M77.0"]
            }
        }
    }
    #phat(){
        return {
            name: "Phalen's Test",
            region: "wrist",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: [],
            purpose: "Assess carpal tunnel syndrome.",
            description: "The patient presses the backs of their hands together.",
            sensitivity: null,
            specificity: null,
            positive: {
                "paresthesia": ["G56.0"]
            }
        }
    }
    #tint(){
        return {
            name: "Tinel's Wrist Test",
            region: "wrist",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: [],
            purpose: "Assess carpal tunnel syndrome.",
            description: "Percuss at the carpal tunnel.",
            sensitivity: 0.45,
            specificity: 0.78,
            positive: {
                "paresthesia": ["G56.0"]
            }
        }
    }
    #tinte(){
        return {
            name: "Tinel's Elbow Test",
            region: "wrist",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: [],
            purpose: "Assess cubital tunnel syndrome.",
            description: "Percuss at the cubital tunnel.",
            sensitivity: 0.70,
            specificity: 0.98,
            positive: {
                "paresthesia": ["G56.2"]
            }
        }
    }
    #finkt(){
        return {
            name: "Finkelstein Test",
            region: "wrist",
            position: "seated",
            type: "provocative",
            for: [],
            altNames: ["Eichhoff Maneuver"],
            purpose: "Assess De Quervain's syndrome.",
            description: "The patient performs ulnar deviation with the thumb in flexion.",
            sensitivity: null,
            specificity: null,
            positive: {
                "pain radiating from the thumb": ["G65.4"]
            }
        }
    }
    #watt(){
        return {
            name: "Watson Test",
            region: "wrist",
            position: "seated",
            type: "provocative",
            for: ["scaphoid shift test"],
            altNames: ["Eichhoff Maneuver"],
            purpose: "Assess scapholunate interosseous ligament instability.",
            description: "The patient performs ulnar deviation with the thumb in flexion.",
            sensitivity: null,
            specificity: null,
            positive: {
                "pain radiating from the thumb": ["G65.4"]
            }
        }
    }
    #antdt(){
        
    }
    #postdlt(){
        
    }
    #medcol(){
        
    }
    #extcol(){
        
    }
    #mcmt(){
        
    }
    #obert(){
        
    }
    #patgt(){
        
    }
    #postdt(){
        
    }
    #latst(){
        
    }
}
class Vitals{
    constructor(){

    }
}

const alphabet = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
function getRandomId(){
    let randomString = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    for(var i = 0; i < 4; ++i) randomString = alphabet[Math.floor(Math.random() * 26)] + randomString;
    return randomString;
}

function el(attr) {
    const el = document.createElement(attr.tagName ? attr.tagName : "div");
    if(!(attr.id)) el.id = getRandomId();
    for(const [key, val] of Object.entries(attr)) {
        switch(key){
            case "attributes":
                for(const [k, v] of Object.entries(coerce.object(val))) el.setAttribute(k, v);
                break;
            case "children":
                for(const child of coerce.array(val)) if(child instanceof Element) el.append(child);
                break;
            case "classList":
                for(const className of coerce.array(val)) el.classList.add(className); 
                break;
            case "dataset":
                for(const [k, v] of Object.entries(coerce.object(val))) el.dataset[k] = v;
                break;
            case "style":
                for(const [k, v] of Object.entries(coerce.object(val))) el.style[kebabCase(k)] = val;
                break;
            default:
                el[key] = val;
                break;
        }
    }
    return el;
}

// script dependencies
document.body.append(
    document.createComment("praktiki for axis"),
    el({
        tagName: "script",
        attributes: {defer: "", type: "module"},
        src: chrome.runtime.getURL("scripts/components.js")
    }),
    el({
        tagName: "script",
        attributes: {defer: "", type: "module"},
        src: chrome.runtime.getURL("scripts/pdf.js")
    })
);

const user = new User();

connectSideSheetFor(user.currentApp.resource).then(() => {
    if(user.currentApp.isBackOffice) {
        enableDragBackOfficeContact();
    } else if (user.currentApp.isFrontOffice);
});

async function connectSideSheetFor(resource){
    switch(resource){
        case "login":
            const row = document.querySelector("button[type=submit]").parentElement;
            row.innerHTML = "";
            row.style.cssText = `
                display: flex;
                flex-direction: row-reverse;
                align-items: center;
                gap: 8px;`;
            row.append(el({
                tagName: "md-filled-button",
                type: "submit",
                innerText: "Connect"
            }));
            row.append(el({
                tagName: "md-text-button",
                type: "submit",
                innerText: "Login"
            }));
            break;
        case "cert-create":
            document.querySelector(".saveCompleted");
            document.body.append(el({
                tagName: "div",
                id: "praktiki-side-sheet",
                classList: ["mdc-side-sheet"],
                innerHTML: await (await fetch(chrome.runtime.getURL("markup/visit.html"))).text()
            }));
            enableMdTabs();
            break;
        case "home":
        case "contacts":
        case "waiting-queue":
        case "pending-notes":
        case "completed-visits":
        case "patient-search":
            document.querySelector("#app .col-md-2").append(el({
                tagName: "div",
                id: "praktiki-side-sheet",
                classList: ["mdc-side-sheet"],
                innerHTML: await (await fetch(chrome.runtime.getURL("markup/contact.html"))).text()
            }));
            enableMdTabs();
            break;
    }
    return document.getElementById("praktiki-side-sheet");
}

function enableDragBackOfficeContact(){
    // custom drag image
    const image = el({
        tagName: "img",
        src: chrome.runtime.getURL("icons/app/48.png")});
    // make contact (tr) draggable
    document.querySelectorAll("table").forEach(table => {
        const dragBehavior = (e = DragEvent) => {
            e.dataTransfer.clearData();
            e.dataTransfer.setData("text", JSON.stringify({
                patient_id: e.target.children[0].dataset["patient_id"],
                visit_id: e.target.children[0].dataset["visit_id"],
                name: e.target.children[0].children[0].innerText,
                dob: e.target.children[2].innerText
            }));
            e.dataTransfer.setDragImage(image, 24, 24);
        };
        const enableDragFor = (node) => {
            node.setAttribute("draggable", "true");
            node.removeEventListener("dragstart", dragBehavior);
            node.addEventListener("dragstart", dragBehavior);
        };
        // enable drag initially
        t.querySelectorAll('tbody tr').forEach(row => {
            enableDragFor(row);
        });
        // enable drag anytime table rows are added
        new MutationObserver((mutationList) => {
            for(const mutation of mutationList){
                if(mutation.type === "childList"){
                    mutation.addedNodes.forEach(node => {
                        if(node instanceof HTMLTableRowElement) enableDragFor(node);
                    });
                }
            }
        }).observe(table, { childList: true });
    });

    let dropZone = document.getElementById("drop-zone");
    // cancel dragover to allow drop
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
    });
    // process drag and drop
    dropZone.addEventListener("drop", async (e) => {
        e.preventDefault();
        e.target.innerHTML = "";
        const data = JSON.parse(e.dataTransfer.getData("text"));
        e.target.append(el({
            tagName: "li",
            innerText: data.name
        }), el({
            tagName: "li",
            innerText: data.dob
        }));
        new BackOfficePatient(user).getPatientById(data.patient_id, data.visit_id).then(patient => {
            
            chrome.storage.local.set({currentPatient: patient});
        });
    });
}

function enableMdTabs(){
    document.querySelectorAll("md-tabs").forEach(tablist => {
        tablist.addEventListener('change', (e) => {
            setTimeout(() => {
                e.target.childNodes.forEach(tab => {
                    if(tab.hasAttribute("active")) document.getElementById(tab.getAttribute("aria-controls")).hidden = false;
                    else document.getElementById(tab.getAttribute("aria-controls")).hidden = true;
                });
            },0);
        });
    });
}
