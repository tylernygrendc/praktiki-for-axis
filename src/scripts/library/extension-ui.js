import { User } from "./axis-user.js";
import { BackOfficePatient } from "./axis-patient.js";
import { extension } from "./extension-meta.js";
import { Child } from "../_child.js";
import { Popup } from "../components/_popup.js";
import { Sheet } from "../components/_sheet.js";
import { Chipset } from "../components/_chips.js";
import { List, Li } from "../components/_list.js"; 
import { Form } from "../components/_form.js";
import { Tablet, Panel } from "../components/_tabs.js";
import { Textfield } from "../components/_textfield.js";
import { RadioList, RadioItem, Radio } from "../components/_radio.js";
import { SwitchList, SwitchItem, Switch } from "../components/_switch.js";
import { Button } from "../components/_button.js";

export async function connectExtensionUI() {
    const user = new User();
    switch(user.currentApp){
        case "axis-front-office": return frontOfficeUI(user);
        case "axis-back-office": return backOfficeUI(user);
    }  
}

export function connectPopup(){
    
}

function backOfficeUI(user = new User()){
    switch(user.currentApp.resource){
        case "cert-create":
            return visitUI(user);
        case "login":
        case "waiting-queue":
        case "pending-notes":
        case "completed-visits":
        case "patient-search":
        case "task-management":
        default:
            return defaultBackOfficeUI();
    }
}

function frontOfficeUI(user){
    return [
        new Sheet("The AXIS Extension",[
            new Button("Print Superbill").setListener("click", createSuperbill),
            new Button("Print Excuse Slip").setListener("click", createExcuseSlip),
            new Button("Print End-of-Day Report").setListener("click", createEODReport,
            new Child("span").setInnerText("Browse more resources..."),
            new List([
                new Li("Coloring Sheets and Puzzles").setLink(`${extension.website}/resources#coloring-sheets-and-puzzles`,true),
                new Li("Stretches and Exercises").setLink(`${extension.website}/resources#stretches-and-exercises`,true),
                new Li("Healthy Lifestyle Tips").setLink(`${extension.website}/resources#healthy-lifestyle-tips`, true),
                new Li("Office Signs and Handouts").setLink(`${extension.website}/resources#office-signs-and-handouts`, true)
            ], true)
        )

        ])
    ];
}

function contactsUI(){
    return [
        new Sheet("The AXIS Extension",[

        ])
    ];
}

function visitUI(user = new User()) {
    if(isCompleteVisit()) return completedVisitUI(user);
    else return pendingVisitUI(user);
}

function completedVisitUI(user = new User()){
    new Sheet("The AXIS Extension - Completed Visit",[
            new Tablet([
                new Panel("",[

                ])
            ])
        ]
    )
}

function pendingVisitUI(user = new User()){

    const patient = new BackOfficePatient();
    
    return [
        new Sheet("The AXIS Extension - Pending Visit",[
            new Form([
                new Textfield("Subjective", "textarea"),
                new Chipset(),
                new Textfield("Relevant History", "textarea"),
                new Chipset(),
                new Textfield("Objective", "textarea"),
                new Chipset(),
                new Textfield("Assessment", "textarea"),
                new Chipset(),
                new Textfield("Plan", "textarea"),
                new Chipset()
            ]),
            new Tablet([
                new Panel("Visit",[
                    new Form([
                        new RadioList("Reason for visit:", [
                            RadioItem(),
                            RadioItem(),
                            RadioItem(),
                            RadioItem()
                        ])
                    ])
                ]),
                new Panel("Procedure",[
    
                ]),
                new Panel("Resources",[
    
                ])
            ])
        ], [
            new Button("Exit").setListener("click", () => {
                document.querySelector("a.navbar-brand").click();
            }, {once: true}),
            new Button("Save").setListener("click", () => {
                document.querySelector("#save").click();
            }),
            new Button("Complete").setListener("click", () => {
                document.querySelector("#complete").click();
            })
        ])
    ];
}

function isCompleteVisit(){
    return new RegExp(/complete/i).test(document.querySelector("CompletedVisitData").innerText);
}

function defaultFrontOfficeUI() {

}

function defaultBackOfficeUI() {

}
