import { kebabCase } from "../_string";
import { Dialog } from "../components/_dialog";
import { Snackbar } from "../components/_snackbar";
export class App {
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
