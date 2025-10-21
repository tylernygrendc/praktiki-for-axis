import { coerce } from "../_type.mjs";
import { App } from "./axis-app";

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
        this.name = null;
        this.prefix = null;
        this.role = null;
        this.authToken = null;
        this.refreshToken = null;
        this.downloadToken = null;
        this.settings = {}
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
                        }
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
                        })
                    }
                });
            }
        } catch (error){
            console.error(error);
        }
    }
}