import { frontOfficeFetch } from "./axis-app";
// import { PDFParse } from "pdf-parse";
// ! PDFParse is imported at document level to avoid collisions
export class Patient {
    constructor(id = "", visitId = ""){
        this.id = id;
        this.visitId = visitId;
        this.visits = [];
        this.problemList = [];
    }
    get previousExam() {
        return this.visits.find(visit => visit.type != 1);
    }
    get previousVisit() {
        return this.visits[0];
    }
    getPatient() {
        new Promise((resolve, reject) => {
            // requests for axis bulk api
            const requests = [
                // patient details
                {
                    type: "GET",
                    dataType: json,
                    timeout: 180000,
                    contentType: "application/json",
                    url: `v11_24/Contacts/${this.id}
                        ?erased_fields=true
                        &view=record
                        &fields=producttype_c%2Cpayment_due%2Cid%2Cbirthdate%2Cpatientcode_c%2Clastvisitdate_c%2Cismedicareeligible_c%2Creferred_by_c%2Csend_forms_c%2Cbundle_type%2Ccarecard_c
                        &viewed=1`
                },
                // visit history
                {
                    type: "GET",
                    dataType: json,
                    timeout: 180000,
                    contentType: "application/json",
                    url: `v11_24/Contacts/${this.id}/link/contacts_tj_purchases_1
                        ?erased_fields=true
                        &view=subpanel-for-contacts-contacts_tj_purchases_1
                        &fields=visit_type%2Cpurchaseactive%2Cstatus%2Cpurchasetype%2Ctax%2Cmonthlyamount_notax%2Covervisitcost_notax%2Cmy_favorite
                        &max_num=${20}
                        &order_by=date_entered%3Adesc`
                }
            ];
            frontOfficeFetch(`https://axis.thejoint.com/rest/v11_24/bulk`, {
                method: "POST",
                body: { requests: requests}
            }).then(res => {
                if(res.ok) {
                    res.json().then(json => {
                        Object.assign(this, json[0].contents.records);
                        this.visits = json[1].contents.records;
                        resolve(this);
                    });
                } else {
                    reject(new Error(res.statusText));
                }
            });
        }).then(() => {
            // requests for axis bulk api
            const requests = [
                // purchase history
                {
                    "type": "GET",
                    "dataType": "json",
                    "timeout": 180000,
                    "contentType": "application/json",
                    "url": `v11_24/Contacts/${this.id}/link/contacts_tj_purchases_1
                        ?erased_fields=true
                        &view=subpanel-for-contacts-contacts_tj_purchases_1
                        &fields=purchaseactive%2Cstatus%2Cpurchasetype%2Ctax%2Cmonthlyamount_notax%2Covervisitcost_notax%2Cmy_favorite
                        &max_num=5
                        &order_by=date_entered%3Adesc`
                },
                // documents
                {
                    "type": "GET",
                    "dataType": "json",
                    "timeout": 180000,
                    "contentType": "application/json",
                    "url": `v11_24/Contacts/${this.id}/link/documents
                        ?erased_fields=true
                        &view=subpanel-for-contacts-documents
                        &fields=date_entered%2Cfilename%2Crelated_doc_id%2Ccategory_id%2Cmy_favorite
                        &max_num=5
                        &order_by=date_modified%3Adesc
                        &filter%5B0%5D%5Bis_incorrect_c%5D=false`,
                },
                // tasks
                {
                    "type": "GET",
                    "dataType": "json",
                    "timeout": 180000,
                    "contentType": "application/json",
                    "url": `v11_24/Contacts/${this.id}/link/all_tasks
                        ?erased_fields=true
                        &view=subpanel-for-contacts-all_tasks
                        &fields=parent_name%2Cdescription%2Cparent_type%2Ctask_script_c%2Ctask_disclaimer%2Ctask_type_c%2Cdri_subworkflow_id%2Cmy_favorite
                        &max_num=5
                        &order_by=status%3Adesc`
                },
                // office notes
                {
                    "type": "GET",
                    "dataType": "json",
                    "timeout": 180000,
                    "contentType": "application/json",
                    "url": `v11_24/Contacts/${this.id}/link/contacts_tj_officenotes_1
                        ?erased_fields=true
                        &view=subpanel-for-contacts-contacts_tj_officenotes_1
                        &fields=date_entered%2Cmy_favorite
                        &max_num=5
                        &order_by=date_entered%3Adesc`,
                },
                // cancellations and freezes
                {
                    "type": "GET",
                    "dataType": "json",
                    "timeout": 180000,
                    "contentType": "application/json",
                    "url": `v11_24/Contacts/${this.id}/link/contacts_tj_patientrequests_1
                        ?erased_fields=true
                        &view=subpanel-for-contacts-contacts_tj_patientrequests_1
                        &fields=type%2Cstatus%2Creason%2Cdate_entered%2Cid%2Csignpaperforms%2Cmy_favorite
                        &max_num=5`,
                },
                // intake forms trackers
                {
                    "type": "GET",
                    "dataType": "json",
                    "timeout": 180000,
                    "contentType": "application/json",
                    "url": `v11_24/Contacts/${this.id}/link/contacts_tj_intakeformstracker_1
                        ?erased_fields=true
                        &view=subpanel-for-contacts-contacts_tj_intakeformstracker_1
                        &fields=my_favorite
                        &max_num=5
                        &order_by=date_modified%3Adesc`,
                }
            ];
            Promise.all([
                // get account data in bulk
                new Promise((resolve, reject) => {
                    frontOfficeFetch("https://axis.thejoint.com/rest/v11_24/bulk", {
                        method: "POST", 
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: { requests: requests }
                    }).then(res => {
                        if(res.ok) {
                            res.json().then(json => {
                                ["purchases", "documents", "tasks", "notes", "requests", "trackers"].forEach((field, i) => {
                                    this[field] = json.content[i];
                                });
                            })
                            resolve(true);
                        } else {
                            reject(new Error(res.statusText));
                        }
                    });
                }),
                // get previous exam details
                new Promise((resolve, reject) => {
                    frontOfficeFetch(`https://axis.thejoint.com/rest/v11_24/GotenbergPdfManager/download
                        ?module=TJ_Visits
                        &record=${this.previousExam.id}
                        &template_name=soap-note
                        &download=true`).then(res => {
                        if(res.ok) {
                            res.arrayBuffer().then(arrayBuffer => {
                                PDFParse(arrayBuffer).then(pdf => {
                                    let array = [];
                                    pdf.text = pdf.text.trim().replaceAll(/[\r\n]/g,"");
                                    // get problems from pdf soap
                                    array = pdf.text.split(/The patient presents with the following complaint\(s\):/g)[1].split(/\sof waking hours/g);
                                    for(let i = 0; i < array.length - 1; ++i){
                                        const [name, severity, frequency] = array[i].split(/\srating\s|\sout of 10 and occurs\s/g);
                                        this.problems.push({
                                            name: name,
                                            severity: `${severity} out of 10`,
                                            frequency: `${frequency} of waking hours`
                                        });
                                    }
                                    // get diagnoses from pdf soap
                                    array = pdf.text.split(/Diagnosis codes:|Following the visit|Plan/g)[1].split(/([A-Z][0-9]{2})/g);
                                    for(let i = 1; i < array.length; ++i){
                                        const str = array[i] + array[++i];
                                        const [code, description] = str.split(/\s\-\s/g);
                                        this.diagnoses.push({
                                            code: code,
                                            description: description
                                        });
                                    }
                                    // get treatment plan from pdf soap
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
                                    resolve(true);
                                });
                            });
                        } else {
                            reject(new Error(res.statusText));
                        }
                    });
                })
            ]).then(() => {
                return this;
            });
        });
    }
}
