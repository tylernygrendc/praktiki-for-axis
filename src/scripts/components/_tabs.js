import { Child } from "../_child.js";
import { Icon } from "./_core.js";

export class Tablet extends Child {
    constructor(panelArray = [], isPrimary = false, activeTabIndex = 0){
        super();
        let idArray = {
            tab: window.crypto.getRandomValues(new Uint32Array(panelArray.length))
                .reduce((acc, cv) => {
                    acc.push(`mdta${cv.toString(16)}`); return acc;
                },[]),
            panel: window.crypto.getRandomValues(new Uint32Array(panelArray.length))
                .reduce((acc, cv) => {
                    acc.push(`mdpa${cv.toString(16)}`); return acc;
                },[])
        };
        this.childList = [
            new Tabs(panelArray.reduce((acc, cv, i) => {
                if(cv instanceof Panel) acc.push(new Tab(isPrimary, cv.label, cv.icon, cv.ariaLabel)
                    .setId(idArray.tab[i]))
                    .setAttribute({"aria-controls": idArray.panel[i]})
                    .setListener("click", function () {
                        try{
                            this.parentElement.querySelectorAll("[class$=tab]").forEach(tab => {
                                if(tab.id === this.id) document.getElementById(tab["aria-controls"]).removeAttribute("hidden");
                                else document.getElementById(tab["aria-controls"]).setAttribute("hidden","true");
                            });
                        } catch (error) {
                            console.groupCollapsed(`There was a problem changing tabs.`);
                            console.error(error);
                            console.groupEnd();
                        }
                    });
                return acc;
            })),
            ...panelArray.reduce((acc, cv, i) => {
                if(cv instanceof Panel) acc.push(cv.setId(idArray.panel[i])
                    .setAttribute({"aria-labeledby": idArray.tab[i]})
                    .setAttribute(activeTabIndex != i ? {hidden:true}:{})); 
                return acc;
            },[])
        ]
    }
}
class Tabs extends Child {
    constructor(tabArray = []){
        super();
        this.id = "";
        this.tag = "md-tabs";
        this.childList = tabArray;
    }
}
class Tab extends Child {
    constructor(isPrimary = false, label = "", icon = "", ariaLabel = ""){
        super();
        this.tag = `md-${isPrimary?"primary":"secondary"}-tab`;
        this.innerText = label;
        if(ariaLabel) this.attributes["aria-label"] = ariaLabel;
        if(icon) this.childList = [new Icon(icon).setAttribute({slot:"icon"})];
    }
}
export class Panel extends Child {
    constructor(label = "", contentArray = [], icon = "", ariaLabel = ""){
        super();
        this.tag = "md-panel";
        this.label = label;
        this.childList = contentArray;
        this.icon = icon;
        this.ariaLabel = ariaLabel;
        this.attributes.role = "tabpanel";
    }
}