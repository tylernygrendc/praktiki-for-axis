class MDSheet extends HTMLElement{
    constructor(){
        super();
        this.animation = {
            slide: slide
        }
    }
    async addContent(contentArray = []){
        try{
            // get sheet content container
            let sheetContent = this.querySelector(".sheet-content");
            // fix sheet content container width
            sheetContent.style.overflow = "hidden";
            sheetContent.style.width = `${sheetContent.clientWidth}px`;
            // populate sheet content container with transparent elements
            for(const item of contentArray){
                if(item instanceof Child) item.setStyle({opacity:0}).appendTo(sheetContent);
                if(item instanceof HTMLElement) item.style.opacity = 0; this.append(item);
            }
            // animate sheet resize to fit new content width
            let animation = sheetContent.animate([
                {width: `${this.clientWidth}px`},
                {width: `${sheetContent.scrollWidth}px`}
            ],{
                duration: motion.duration.short,
                easing: motion.easing.decelerate,
                iterations: 1,
                fill: "forwards"
            });
            await animation.finished;
            animation.commitStyles();
            animation.cancel();
            // animate opacity change on all content elements
            let contentElements = this.querySelectorAll(".sheet-content > *");
            if(contentElements.length){
                let i = 0, visibleContentHeight = 0, j = 0;
                // if lots of elements, only animate the visible ones
                while(sheetContent.clientHeight > visibleContentHeight && i < contentElements.length){
                    visibleContentHeight += contentElements[i++].clientHeight;
                }
                for(j = 0; j < i; ++j){
                    animation = sheetContent[j].animate([
                        {opacity: 0},
                        {opacity: 1}
                    ], {
                        duration: motion.duration.short,
                        easing: motion.easing.decelerate,
                        iterations: 1,
                        fill: "forwards"
                    });
                    await animation.finished;
                    animation.commitStyles();
                    animation.cancel();
                }
                for(j = i; j < contentElements.length; ++j){
                    sheetContent[j].style.opacity = 1;
                }
            }
            sheetContent.overflow = "scroll";
        } catch (error) {
            console.groupCollapsed("Could not add content to <md-sheet>.");
            console.consoleError(error);
            console.groupEnd();
        }
    }
    connectedCallback(){
        this.animation.slide();
    }
    async removeContent(){
        try{
            // get sheet content container
            let sheetContent = this.querySelector(".sheet-content");
            // fade out container
            let animation = sheetContent.animate([
                {opacity: 1},
                {opacity: 0}
            ], {
                duration: motion.duration.short,
                easing: motion.easing.decelerate,
                iterations: 1,
                fill: "forwards"
            });
            await animation.finished;
            animation.commitStyles();
            animation.cancel();
            // remove content
            sheetContent.innerHTML = "";
            // resize sheet
            animation = this.animate([
                {width: `${this.clientWidth}px`},
                {width: `${sheetContent.scrollWidth}px`}
            ],{
                duration: motion.duration.short,
                easing: motion.easing.decelerate,
                iterations: 1,
                fill: "forwards"
            });
            await animation.finished;
            animation.commitStyles();
            animation.cancel();
        } catch (error) {
            console.groupCollapsed("Could not remove content from <md-sheet>.");
            console.consoleError(error);
            console.groupEnd();
        }
    }
    replaceContent(contentArray = []){
        this.removeContent();
        this.addContent(contentArray);
    }
}

async function slide() {
    let positionStart = this.style.translate ? this.style.translate.split(" ") : ["0%","0%"];
    let keyframes = [{translate: `${positionStart[0]} ${positionStart[1] != undefined ? positionStart[1] : "0%"}`}];
    if(this.style.left === "100svw") keyframes.push({translate: `${positionStart[0] === "0%" ? "-100%" : "0%"} 0%`});
    if(this.style.top === "100svh") keyframes.push({translate: `0% ${positionStart[1] === "0%" ? "-100%" : "0%"}`});
    let animation = this.animate(keyframes, {
        duration: motion.duration.medium,
        easing: motion.easing.decelerate,
        iterations: 1,
        fill: "forwards"
    });
    await animation.finished;
    animation.commitStyles();
    animation.cancel();
}

customElements.define("md-sheet", MDSheet);