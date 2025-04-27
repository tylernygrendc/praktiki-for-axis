import { App } from "./axis-app";

export class User {
    constructor(){
        // initialize interface
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
        this.name = null;
        this.prefix = null;
        this.role = null;
        this.token = null;
        this.settings = {
            useDarkMode: false,
            hideUI: false,
            useSubluxationTerminology: false
        }
        this.initialize();
    }
    async initialize(){
        this.populateUser();
        await this.populateClinic(await this.clinicId());
    }
    populateUser(){
        // set properties by application
        let profileNode, username = "", authToken;
        switch(this.currentApp.name){
            case "axis-back-office":
                try{
                    // get client nodes
                    authToken = document.querySelector("meta[name=csrf-token]");
                    profileNode = document.getElementById("navbarDropdown");
                    // define user properties
                    if(authToken != null) this.token = authToken.content;
                    if(profileNode != null) {
                        this.credential = "DC";
                        this.name = profileNode.innerText.replace(/\s\W/g,"");
                        this.prefix = "Dr.";
                        this.role = "Doctor of Chiropractic";
                    }
                } catch (error) {
                    console.error(error);
                }
                break;
            case "axis-front-office":
                // get client node
                profileNode = document.querySelector("#userList button");
                // define user properties
                if(profileNode != null) {
                    try{
                        if(node.title) username = profileNode.title;
                        else if(node.dataset.originalTitle) username = node.dataset.originalTitle;
                        else if(localStorage.getItem("userdata")) username = JSON.parse(localStorage.getItem("userdata")).username;
                        this.name = capitalize(username.replace("dr.","").replace(/./g," "));
                        if(username.substring(0,2).match("dr") ? true : false){
                            this.credential = "DC";
                            this.prefix = "Dr.";
                            this.role = "Doctor of Chiropractic";
                        } else {
                            this.role = "Wellness Coordinator";    
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
                this.token = localStorage.getItem("prod:SugarCRM:AuthAccessToken");
                break;
        }
    }  
    async populateClinic(id){
        if(this.currentApp.isFrontOffice){
            try{
                const response = await fetch(`https://axis.thejoint.com/rest/v11_20/TJ_Clinics/${id}?erased_fields=true&view=record`,{
                    method: "GET",
                    headers: { 
                        "Oauth-Token": this.token,
                        "Content-Type": "application/json"
                    }
                });
                if(response.ok) {
                    const clinic = await response.json();
                    // set object properties
                    this.clinic.id = clinic.id;
                    this.clinic.name = clinic.name;
                    this.clinic.address.street = clinic.billing_address_street;
                    this.clinic.address.city = clinic.billing_address_city;
                    this.clinic.address.state = clinic.billing_address_state;
                    this.clinic.address.zip = clinic.billing_address_postalcode;
                    this.clinic.phone = clinic.phone1;
                    this.clinic.email = clinic.email;
                    this.clinic.company = clinic.pc;
                    if(clinic.business_entity) this.clinic.entity = clinic.business_entity;
                    // business is misspelled occasionally
                    if(clinic.bussiness_entity) this.clinic.entity = clinic.bussiness_entity;
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
    async clinicId(name = this.clinicName()){
        try{
            let query = name.split(" ")
                .reduce((acc, cv, i, arr) => {
                    if(arr.length - 1 < i) acc += `${cv}%20`;
                    else acc += `${cv}`;
                    return acc;
                },`https://axis.thejoint.com/rest/v11_20/TJ_Clinics?erased_fields=true&view=list&max_num=1&order_by=date_modified%3Adesc&filter%5B0%5D%5Bname%5D%5B%24starts%5D=`);
            let response = await fetch(query, {
                method: "GET",
                headers: { 
                    "Oauth-Token": this.token,
                    "Content-Type": "application/json"
                }
            });
            if(response.ok) {
                response = await response.json();
                return response.records[0].id;
            }
        } catch (error) {
            console.error(error);
            return null;
        }
    }
    clinicName(){
        let clinicSlot;
        if(this.currentApp.isBackOffice) clinicSlot = document.querySelector("#navbarSupportedContent ul.ms-auto li");
        if(this.currentApp.isFrontOffice) clinicSlot = document.querySelector(".header-current-clinic");
        return clinicSlot != null ? clinicSlot.innerText : null;
    }
    isLoggedIn(){
        if(this.currentApp.isBackOffice) return window.location.pathname.match(/login/g) ? false : true;
        if(this.currentApp.isFrontOffice) return document.querySelector(".login") != null ? false : true;
    }
}