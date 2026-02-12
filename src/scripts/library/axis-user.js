import { App, frontOfficeFetch } from "./axis-app";
import { is } from "../_type.mjs";
import { contentStorage } from "./chrome-storage";
export class User {
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
        }
        this.credential = null; 
        this.currentApp = new App();
        this.email = null;
        this.id = null;
        this.isBetaUser = false;
        this.isPrimaryUser = null;
        this.name = null;
        this.prefix = null;
        this.role = null;
        this.settings = {}
        this.username = null;
    }
    get csrfToken() {
        try {
            if(this.currentApp.isBackOffice){
                return document.querySelector("meta[name=csrf-token]").content;
            } else {
                throw new Error(`csrf-token cannot be accessed from front office.`);
            }
        } catch (error) {
            console.error(error);
            return "";    
        }
    }
    get oauthToken() {
        try {
            if(this.currentApp.isFrontOffice) {
                return localStorage.getItem("prod:SugarCRM:AuthAccessToken");
            } else {
                throw new Error(`oauthToken cannot be accessed from back office.`);
            }
        } catch (error) {
            console.error(error);
            return "";    
        }
    }
    getUser() {
        return new Promise((resolve, reject) => {
            // get current user from front office
            frontOfficeFetch("https://axis.thejoint.com/rest/v11_24/me").then(res => {
                if(res.ok) res.json().then(json => { resolve(json); });
                else reject(new Error(res.statusText));
            });
        }).then(json => {
            // update user
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
            }
            this.isBetaUser = json.current_user.beta_features;

            // check if this is the primary user
            return contentStorage.get("primaryUser", "sync").then(record => {
                if(record.results.primaryUser.username === this.username) {
                    this.isPrimaryUser = true;
                    this.settings = primaryUser.settings;
                } else if(record.results.primaryUser === null) {
                    // sync storage has not been enabled
                    // the user defaults to primary
                    this.isPrimaryUser = true;
                    // settings are not defined
                } else {
                    // this is a guest user
                    this.isPrimaryUser = false;
                }
                // allow chaining
                return this;
            })
        }).catch(error => { console.error(error); return this; });
    }
    getClinic(){
        new Promise((resolve, reject) => {
            // reject if clinic id is unset
            if(!(this.clinic.id)) reject(new Error(`Clinic ${this.clinic.id} is invalid. Call method getUser() before getClinic().`))
            // get current clinic from front office
            frontOfficeFetch(`https://axis.thejoint.com/rest/v11_24/TJ_Clinics/${this.clinic.id}?erased_fields=true&view=record`).then(res => {
                if(res.ok) res.json().then(json => { resolve(json); });
                else reject(new Error(res.statusText));
            });
        }).then(json => {
            this.clinic.name = json.name;
            this.clinic.address.street = json.billing_address_street;
            this.clinic.address.city = json.billing_address_city;
            this.clinic.address.state = json.billing_address_state;
            this.clinic.address.zip = json.billing_address_postalcode;
            this.clinic.phone = json.phone1;
            this.clinic.email = json.email;
            this.clinic.company = json.pc;
            // ? business is misspelled occasionally
            this.clinic.entity = json.bussiness_entity ? json.bussiness_entity: json.business_entity;
            // allow chaining
            return this;
        }).catch(error => { console.error(error); return this; });
    }
    getAuthorizedClinics(){
        new Promise((resolve, reject) => {
            // get all clinics that the user can access
            frontOfficeFetch("https://axis.thejoint.com/rest/v11_24/Dashboards/enum/clinicslist").then(res => {
                if(res.ok) res.json().then(json => { resolve(json); });
                else reject(new Error(res.statusText));
            });
        }).then(json => {
            const requests = [];
            for(const key of Object.keys(json)){
                requests.push({
                    type: "GET",
                    dataType: "json",
                    timeout: 180000,
                    contentType: "application/json",
                    url: `https://axis.thejoint.com/rest/v11_24/TJ_Clinics/${key}?erased_fields=true&view=record`
                })

            }
            const authorizedClinic = (record = {}) => {
                return {
                    name: record.name,
                    address: {
                        street: record.billing_address_street,
                        city: record.billing_address_city,
                        state: record.billing_address_state,
                        zip: record.billing_address_postalcode
                    },
                    phone: record.phone1,
                    email: record.email,
                    company: record.pc,
                    entity: record.bussiness_entity ? record.bussiness_entity : record.business_entity
                }
            };
            frontOfficeFetch("https://axis.thejoint.com/rest/v11_24/bulk",{
                body: { requests: requests}
            }).then(res => {
                if(res.ok) {
                    res.json().then(json => {
                        if(is.array(json.contents.records)){
                            for(const record of json.contents.records){
                                this.authorizedClinics.push(authorizedClinic(record));  
                            }
                            // allow chaining
                            return this;
                        } else {
                            throw new Error (`Records must be type of array. Received ${typeof json.contents.records}.`);
                        }
                    });
                } else {
                    throw new Error(res.statusText);
                }
            });
        }).catch(error => { console.error(error); return this; });
    }
}