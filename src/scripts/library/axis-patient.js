import { assertElement } from "../_utilities";
import { dayNames, daysBetween, formatDate } from "../_date";
import { User } from "./axis-user";
import PdfParse from "pdf-parse";
import { isValidElement } from "react";
export class BackOfficePatient {
    constructor(docRef = document, user = new User()){
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
        }
        this.documentMap = {};
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
        // scrape axis for information (synchronous)
        this.getInformationFromSidebar(docRef);
        this.getAreasOfConcern(docRef);
        this.getDocumentMap(docRef);
        this.getGeneralNotes(docRef);
        this.getIntake(docRef);
    }
    async initialize(){
        await this.getAccountDetails();
        await this.getPreviousExamAndVisit();
        return this;
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
    async getAccountDetails(fname = this.fname, lname = this.lname, dob = this.dob, phone = this.phone){
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

export class FrontOfficePatient{
    constructor(docRef = document, user = new User()){
        // document reference
        this.docRef = docRef;
        // user reference
        this.user = user;
        // basic information
        this.id = "";
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
        // documents
        this.documentMap = {};
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
        this.getInformationFromPanel(docRef);
    }
    async initialize(){
        await this.getInformationFromAXIS();
        await this.getPreviousExamAndVisit();
        return this;
    }
    getInformationFromPanel(docRef = document) {
        let detail = null;
        const details = {};
        docRef.querySelectorAll("[id^=LBL_RECORDVIEW_PANEL] .record-cell .detail .index")
            .forEach(index => {
                detail = index.querySelector(".detail .ellipsis_inline, .detail input[type=checkbox], .detail .btn");
                details[index.dataset.fieldname] = detail instanceof HTMLInputElement ? detail.checked : assertElement(detail).innerText;
            });
        for(const [key, val] of Object.entries(details)) {
            if(val != null){
                switch(key){
                    case "preferred_name_c":
                        this.preferredName = val;
                        break;
                    case "birthdate":
                        this.dob = formatDate(val, "yyyy-mm-dd");
                        break;
                    case "age_c":
                        this.age = val;
                        break;
                    case "sex_c":
                        this.sex = val;
                        break;
                    case "gender_identity":
                        this.gender = val;
                        break;
                    case "phone_mobile":
                        this.phone = val;
                        break;
                    case "email":
                        this.email = val;
                        break;
                    case "occupation_c":
                        this.occupation = val;
                        break;
                    case "quick_patient_info":
                        this.generalNotes = val;
                        break;
                    case "ismedicareeligible_c":
                        this.isMedicareEligible = val;
                        break;
                    case "hsa_or_fsa":
                        this.savingsAccount = val;
                        break;
                    case "see_notes":
                        this.hasSeeNotesFlag = val;
                        break;
                    case "is_military":
                        this.isMilitary = val;
                        break;
                    case "needs_forms_c":
                        this.hasFormsDue = val;
                        break;
                    case "producttype_c":
                        this.product.type = val;
                        break;
                    case "plan_status":
                        this.product.pendingCancellation = /pending/gi.test(val);
                        break;
                    case "tj_clinics_contacts_1_name":
                        this.product.homeClinic = val;
                        break;
                    case "recurringday":
                        this.product.cycleDate = val;
                        break;
                    case "balance":
                        this.product.balanceDue = val;
                        this.product.hasBalance = parseFloat(val) ? true : false;
                        this.hasPaymentDue = this.product.hasBalance;
                        break;
                    case "rpv_c":
                        this.product.visitsRemaining = val;
                    case "lastvisitdate_c":
                        this.previousVisit.date = new Date(val);
                        break;
                    case "tvtm_c":
                        this.product.visitsUsed = val;
                    case "cardtype_c":
                        this.payment.type = val;
                        break;
                    case "lastfour_c":
                        this.payment.lastFour = val;
                        break;
                    case "expdate_c":
                        this.payment.expiration = val;
                        break;
                    case "status_c":
                        this.payment.status = val;
                        break;
                    case "mobile_status":
                        this.payment.mobileStatus = /active/gi.test(val);
                        break;
                    case "new_patient_flag_c":
                        this.isNewPatient = val ? true : false;
                        break;
                }
            }
        }
        return this;
    }
    async getInformationFromAXIS(){
        const res = await fetch(`https://axis.thejoint.com/rest/v11_24/Contacts/search_patient?filter%5Bfirst_name%5D=${this.fname}&filter%5Blast_name%5D=${this.lname}&filter%5Bphone_mobile%5D=${this.phone}&filter%5Bbirthdate%5D=${this.dob}`, { 
            "method": "GET",
            "headers": {
                "OAuth-Token": this.user.authToken
            }
        });
        if(res.ok) {
            res.json().then(json => {
                if(json.records.length === 1) {
                    this.id = json.records[0].id;
                    this.hasABNDue = json.records[0].abn_c ? true : false;
                    this.hasDoNotAdjust = json.records[0].has_do_not_adjust ? true : false;
                    this.hasFormsDue = json.records[0].needs_forms_c ? true : false;
                    this.hasPaymentDue = json.records[0].pay_flag ? true : false;
                    this.hasOpenTask = json.records[0].ot ? true : false;
                    this.hasSeeNotesFlag = json.records[0].see_notes ? true : false;
                    this.isMedicareEligible = json.records[0].ismedicareeligible_c ? true : false;
                    this.isMilitary = json.records[0].is_military ? true : false;
                    this.isNewPatient = json.records[0].new_patient_flag_c ? true : false;
                    this.product.type = json.records[0].producttype_c;
                    this.product.cycleDate = json.records[0].recurringday;
                    this.product.visitsRemaining = json.records[0].rpv_c;
                    this.product.hasBalance = json.records[0].pay_flag ? true : false;
                    this.product.balanceDue = json.records[0].balance;
                    this.product.careCardsRemaining = json.records[0].carecard_c;
                    this.product.homeClinic = json.records[0].tj_clinics_contacts_1_name;
                    this.previousVisit.date = new Date(json.records[0].lastvisitdate_c);
                    this.previousVisit.doctor = `Dr. ${json.records[0].last_dc_name}`;
                    this.previousVisit.id = json.records[0].lastvisitid_c;
                }
            });
        }
        return this;
    }
    async getPreviousExamAndVisit(id = this.id){
        try{
            const res = await fetch(`https://axis.thejoint.com/rest/v11_24/Contacts/${id}/link/contacts_tj_visits_1?erased_fields=true&view=preview&fields=date_entered
                case "cstatus
                case "cvisit_type
                case "ctj_clinics_tj_visits_1_name
                case "ccontacts_tj_visits_1_name
                case "cusers_tj_visits_2_name
                case "c&max_num=24%7B%7BmaxNum%7D%7D&order_by=date_entered%3Adesc&filter%5B0%5D%5Bstatus%5D=Completed`, {
                "method": "GET",
                "headers": {
                    "OAuth-Token": this.user.authToken
                }
            });
            if(res.ok){
                res.json().then(async json => {
                    if(json.records.length){
                        this.previousVisit.id = json.records[0].id;
                        this.previousVisit.date = new Date(json.records[0].date_entered);
                        this.previousVisit.day = dayNames[this.previousVisit.date.getDay()];
                        this.previousVisit.clinic = json.records[0].tj_clinics_tj_visits_1_name;
                        this.previousVisit.doctor = json.records[0].users_tj_visits_2_name;
                        this.previousVisit.node = await new FrontOfficeVisit(json.records[0].id).initialize();
                        const exam = json.records.find(record => { 
                            record.visit_type != "1"; 
                        });
                        if(exam.id) {
                            this.previousExam.id = exam.id;
                            this.previousExam.date = new Date(exam.date_entered);
                            this.previousExam.day = dayNames[this.previousExam.date.getDay()];
                            this.previousExam.clinic = exam.tj_clinics_tj_visits_1_name;
                            this.previousExam.doctor = exam.users_tj_visits_2_name;
                            this.previousExam.node = await new FrontOfficeVisit(exam.id).initialize();
                        }
                    }
                });
            }
        } catch (error) {
            console.error(error);    
        } finally {
            return this;
        }
    }
    async getTransactionHistoryFromAXIS(){
        const res = await fetch(`https://axis.thejoint.com/rest/v11_24/Contacts/${this.id}/custom_link/contacts_transactions_refunds?filter%5B0%5D%5Bdate_entered%5D%5B%24dateBetween%5D%5B%5D=${start}&filter%5B0%5D%5Bdate_entered%5D%5B%24dateBetween%5D%5B%5D=${end}`, {
            method: "GET", 
            headers: {
                "OAuth-Token": this.user.authToken
            }
        });
        if(res.ok) {
            res.json().then(json => {
                json.records.forEach(record => {
                    // do something
                });
            });
        }
    }
    async getPurchaseHistoryFromAXIS(){
        const res = await fetch(`https://axis.thejoint.com/rest/v11_24/Contacts/${this.id}/link/contacts_tj_purchases_1?erased_fields=true&view=subpanel-for-contacts-contacts_tj_purchases_1&fields=purchaseactive
            case "cstatus
            case "cpurchasetype
            case "ctax
            case "cmonthlyamount_notax
            case "covervisitcost_notax
            case "cmy_favorite&max_num=${maxNum}&order_by=date_entered%3Adesc`, {
            method: "GET", 
            headers: {
                "OAuth-Token": this.user.authToken
            }
        });
        if(res.ok) {
            res.json().then(json => {
                json.records.forEach(record => {
                    // do something
                });
            });
        }
    }
    async getDocumentsFromAXIS(){
        const res = await fetch(`https://axis.thejoint.com/rest/v11_24/Contacts/${this.id}/link/documents?erased_fields=true&view=subpanel-for-contacts-documents&fields=date_entered
            case "cfilename
            case "crelated_doc_id
            case "ccategory_id
            case "cmy_favorite&max_num=${maxNum}&order_by=date_modified%3Adesc&filter%5B0%5D%5Bis_incorrect_c%5D=false`, {
            method: "GET", 
            headers: {
                "OAuth-Token": this.user.authToken
            }
        });
        if(res.ok) {
            res.json().then(json => {
                json.records.forEach(record => {
                    // do something
                });
            });
        }
    }
    async getVisitHistoryFromAXIS(){
        const res = await fetch(`https://axis.thejoint.com/rest/v11_24/Contacts/${this.id}/link/contacts_tj_visits_1?erased_fields=true&view=subpanel-for-contacts-contacts_tj_visits_1&fields=date_entered
            case "cstatus
            case "chas_carecard
            case "cmy_favorite&max_num=${maxNum}&order_by=date_entered%3Adesc&filter%5B0%5D%5Bstatus%5D=Completed`, {
            method: "GET", 
            headers: {
                "OAuth-Token": this.user.authToken
            }
        });
        if(res.ok) {
            res.json().then(json => {
                json.records.forEach(record => {
                    // do something
                });
            });
        }
    }
    async getTasksFromAXIS(){
        const res = await fetch(`https://axis.thejoint.com/rest/v11_24/Contacts/${this.id}/link/all_tasks?erased_fields=true&view=subpanel-for-contacts-all_tasks&fields=parent_name
            case "cdescription
            case "cparent_type
            case "ctask_script_c
            case "ctask_disclaimer
            case "ctask_type_c
            case "cdri_subworkflow_id
            case "cmy_favorite&max_num=${maxNum}&order_by=status%3Adesc`, {
            method: "GET", 
            headers: {
                "OAuth-Token": this.user.authToken
            }
        });
        if(res.ok) {
            res.json().then(json => {
                json.records.forEach(record => {
                    // do something
                });
            });
        }
    }
    async getOfficeNotesFromAXIS(){
        const res = await fetch(`https://axis.thejoint.com/rest/v11_24/Contacts/${this.id}/link/contacts_tj_officenotes_1?erased_fields=true&view=subpanel-for-contacts-contacts_tj_officenotes_1&fields=date_entered
            case "cmy_favorite&max_num=${maxNum}&order_by=date_entered%3Adesc`, {
            method: "GET", 
            headers: {
                "OAuth-Token": this.user.authToken
            }
        });
        if(res.ok) {
            res.json().then(json => {
                json.records.forEach(record => {
                    // do something
                });
            });
        }
    }
    async getPatientRequestsFromAXIS(){
        const res = await fetch(`https://axis.thejoint.com/rest/v11_24/Contacts/${this.id}/link/contacts_tj_patientrequests_1?erased_fields=true&view=subpanel-for-contacts-contacts_tj_patientrequests_1&fields=type
            case "cstatus
            case "creason
            case "cdate_entered
            case "cid
            case "csignpaperforms
            case "cmy_favorite&max_num=${maxNum}`, {
            method: "GET", 
            headers: {
                "OAuth-Token": this.user.authToken
            }
        });
        if(res.ok) {
            res.json().then(json => {
                json.records.forEach(record => {
                    // do something
                });
            });
        }
    }
    async getIntakeFormTrackerFromAXIS(){
        const res = await fetch(`https://axis.thejoint.com/rest/v11_24/Contacts/${this.id}/link/contacts_tj_intakeformstracker_1?erased_fields=true&view=subpanel-for-contacts-contacts_tj_intakeformstracker_1&fields=my_favorite&max_num=${maxNum}&order_by=date_modified%3Adesc`, {
            method: "GET", 
            headers: {
                "OAuth-Token": this.user.authToken
            }
        });
        if(res.ok) {
            res.json().then(json => {
                json.records.forEach(record => {
                    // do something
                });
            });
        }
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
                this.date = (()=>{date = date.split(/\-/); return new Date(date[2], date[0], date[1])})();
                this.type = type;
                this.doctor = typeof doctor === "string" ? `Dr. ${doctor}` : null
            }
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
        visit.querySelectorAll("#pills-orthopedic table tbody tr td button:not(.document-nuances)").forEach(button => {
            this.orthoFindings.push(new OrthopedicTest(button.name, button.value));

        });
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
        this.palpatoryFindings = [];
        visit.querySelectorAll("#palpatoryAdj tr button.multiState").forEach(button => {
            this.palpatoryFindings.push(new BackSpasm(button.name, button.value));
        });
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
class FrontOfficeVisit{
    constructor(patient = new FrontOfficePatient(), visitId = ""){
        this.id = visitId;
        this.clinic = "";
        this.date = null;
        this.day = "";
        this.doctor = "";
        this.diagnoses = [];
        this.patient = {
            id: patient.id,
            name: patient.name,
            fname: patient.fname,
            lname: patient.lname,
            initials: patient.initials,
            finitial: patient.finitial,
            linitial: patient.linitial,
            dob: patient.dob,
            age: patient.age,
            sex: patient.sex
        };
        this.problems = [];
        this.product = "";
        this.status = "";
        this.treatmentPlan = [];
        this.type = "";
    }
    async initialize() {
        await this.getVisitById()
        await this.parseVisitText();
        return this;
    }
    async getVisitById(id = this.id){
        try{
            const res = await fetch(`https://axis.thejoint.com/rest/v11_24/TJ_Visits/${id}
                ?erased_fields=true
                &view=record
                &fields=date_entered
                case "cstatus
                case "cfilename
                case "crelated_doc_id
                case "ccategory_id
                case "cpurchaseactive
                case "cpurchasetype
                case "cvisit_type
                case "cvisit_price
                &viewed=1`, {
                    "method": "GET",
                    "headers": {
                        "user-agent": "vscode-restclient",
                        "oauth-token": "37cb9869-e72e-4f3d-b7b8-6547431c67fc"
                    }
                });
            if(res.ok){
                res.json().then(json => {
                    this.clinic = json.tj_clinics_tj_visits_1_name;
                    this.doctor = json.users_tj_visits_2_name;
                    this.date = new Date(json.date_entered);
                    if(!(Number.isNaN(this.date.getTime()))) this.day = this.date.getDay();
                    this.product = json.plan_c;
                    this.status = json.status;
                    this.type = ((type = json.type) => {
                        switch(type){
                            case "1":
                                return "Treatment";
                            case "2":
                                return "Evaluation";
                            case "3":
                                return "Evaluation and Treatment";
                        }
                    })();
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            return this;
        }
    }
    async parseVisitText(visitDate = this.date){
        try{
            const res = await fetch(
                `https://axis.thejoint.com/rest/v11_24/GotenbergPdfManager/download
                    ?module=Contacts
                    &record=${this.patient.id}
                    &template_name=soap-notes
                    &date_entered_from=${formatDate(visitDate, "yyyy-mm-dd")}
                    &date_entered_to=${formatDate(visitDate.setDate(visitDate.getDate() + 1), "yyyy-mm-dd")}`,
            {
                method: "GET",
                headers: {
                    "OAuth-Token": this.user.authToken
                }
            });
            if(res.ok) {
                res.arrayBuffer().then(arrayBuffer => {
                    PdfParse(arrayBuffer).then(pdf => {
                        pdf.text = pdf.text.trim().replaceAll(/[\r\n]/g,"");
                        let array = pdf.text.split(/The patient presents with the following complaint\(s\):/g)[1].split(/\sof waking hours/g);
                        for(let i = 0; i < array.length - 1; ++i){
                            const [name, severity, frequency] = array[i].split(/\srating\s|\sout of 10 and occurs\s/g);
                            this.problems.push({
                                name: name,
                                severity: `${severity} out of 10`,
                                frequency: `${frequency} of waking hours`
                            });
                        }
                        array = pdf.text.split(/Diagnosis codes:|Following the visit|Plan/g)[1].split(/([A-Z][0-9]{2})/g);
                        for(let i = 1; i < array.length; ++i){
                            const str = array[i] + array[++i];
                            const [code, description] = str.split(/\s\-\s/g);
                            this.diagnoses.push({
                                code: code,
                                description: description
                            });
                        }
                        array = pdf.text.split(/Chiropractic adjustments were performed on the following levels:/g)[1].split(/Treatment plan:|Recommended re-evaluation date:|Treatment Items:VisitsPer WeekBy DC|Chiropractor:/g);
                        this.treatmentPlan.description = array[1];
                        this.treatmentPlan.end = array[2];
                        this.treatmentPlan.breakdown = array[3].split(/[0-9]/g).reduce((acc, cv, i) => {
                            if(/[0-9]/g.test(cv)) acc.push(cv);
                            return acc;
                        },[]).reduce((acc, cv, i, arr) => {
                            if(!(i % 2)) acc.push({
                                frequency: cv,
                                duration: arr[i + 1]
                            });
                        });
                    });
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            return this;
        }
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
    constructor(){

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
        return Object.values(this.result).some((value => {value.isRestricted === true}));
    }
    get isPainful(){
        return Object.values(this.result).some((value => {value.isPainful === true}));
    }
    addFinding(range = "", restriction = "", pain = ""){
        const axisRef = {
            pain: range.replace(/norm$|rest$/gi,"pain"),
            restriction: range.replace(/norm$|pain$/gi,"rest")
        }
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
class OrthopedicTest{
    constructor(name = "", side = ""){
        this.axisRef = name;
        this.name = name.replaceAll(/(?<!othe)[rl]$|[rl]_c|_[lmr]|_[0-9]+/gi,"");
        if(typeof this[`#${this.name}`] === "function") Object.assign(this, this[`#${this.name}`]());
        else Object.assign(this, this.#lookup(this.name));
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
        return Object.values(this.result).some((value => {value.isPositive === true}));
    }
    addFinding(isPositive = null, description = []){
        this.result = {
            isPositive : typeof isPositive === "boolean" ? isPositive : null,
            description: typeof description === "object" ? description : [description]
        }
    }
    #lookup(testName = ""){
        switch(testName = ""){
            case "Empty Can Test":
                return {
                    name: "Empty Can Test",
                    region: "shoulder"
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
