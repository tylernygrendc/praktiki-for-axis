import "./_components.mjs";
import { User } from "./library/axis-user";
import { coerce } from "./_type.mjs";

const user = new User();

switch(user.currentApp.resource){
    case "login":
        if(user.currentApp.isBackOffice){
            coerce.element(document.querySelector("button[type=submit]")).addEventListener("click", async () => {
                chrome.runtime.sendMessage(
                    {
                        source: {
                            event: "back-office-login",
                            type: "content-script",
                            file: "content.js"
                        },
                        body: {
                            username: (() => {
                                coerce.element(document.querySelector("input#user_name")).value
                            })(),
                            password: (() => {
                                coerce.element(document.querySelector("input#password")).value
                            })()
                        }
                    }, (res) => {
                        sessionStorage.setItem("frontOfficeAuth", res);
                    }
                );
            });
        } else if (user.currentApp.isFrontOffice){
            // do nothing
        }
        break;
    case "cert-create":
        connectVisitUI(await user.initialize());
        break;
    case "home":
    case "contacts":
    case "waiting-queue":
    case "pending-notes":
    case "completed-visits":
        connectContactsUI(await user.initialize());
        break;
    case "patient-search":
    case "task-management":
    case "tasks":
    case "tj_clinics":
    case "tj_custom_reports":
    default:
        // do nothing
        break;
}
