import { Child } from "../_child";

export class Form extends Child {
    constructor(itemsArray=[]){
        super();
        this.tag = "form";
        this.childList = coerce.array(itemsArray);
    }
    getSelection(){
        return this.childList.reduce((acc, cv) => {
            if(cv instanceof Chipset || cv instanceof Select || cv instanceof Slider || cv instanceof Textfield)
                acc.push(cv.getSelection());
            return acc;
        },[]);
    }
}