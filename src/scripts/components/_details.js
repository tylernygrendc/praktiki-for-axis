import { Child } from "../_child";

export class Details extends Child{
    constructor(summary = "", summaryOpen = ""){
        super();
        this.tag = "details";
        this.childList = [
            new Child("summary")
                .setInnerText(summary)
                .setDataset({summary: summary, summaryOpen: summaryOpen})
                .setListener("click", function(){
                    if(this.parentElement.hasAttribute("open")) this.innerText = this.dataset.summary;
                    else this.innerText = this.dataset.summaryOpen;
                })
        ]
    }
}