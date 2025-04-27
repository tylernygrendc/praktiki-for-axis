import "./_core.js";
import { Child } from "../_child.js";
import { Divider } from "./_divider.js";
import { Iconbutton } from "./_icon.js";
import { breakpoints, motion } from "./_md.js";

export class Sheet extends Child {
    constructor(headline = "", contentArray = [], actionsArray = [], options = {}){
        super();
        this.tag = "md-sheet";
        this.styles = {
            position: "fixed",
            inset: window.innerWidth < breakpoints.large ? "100svh 0 auto 0" : "0 auto 0 100svw"
        };
        this.childList = [
            new Child("span")
                .setClassList("sheet-headline")
                .setInnerText(headline),
            new Iconbutton("close")
                .setAriaLabel("close sheet")
                .setClassList("sheet-close")
                //! problem here
                .setListener("click", slide, {once: true}),
            new Child()
                .setClassList(["sheet-content"])
                .setChildList(contentArray)
        ];
        if(actionsArray.length) this.childList.push([
            new Child()
                .setClassList(["sheet-actions"])
                .setChildList([
                    new Divider(),
                    ...actionsArray
                ])
        ]);
        this.shadowRoot = {
            isAttached: true,
            mode: "closed",
            clonable: "false",
            childList: [
                new Child().setClassList(["scrim"])
            ]
        };
    }
}