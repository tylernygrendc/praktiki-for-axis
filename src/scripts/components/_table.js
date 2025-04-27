import { alphabet } from "../_utilities.js";
import { Child } from "../_child.js";
import { Divider, Progress } from "./_core.js";

export class Table extends Child {
    constructor(dataArray = [], filterArray = []){
        if(!filterArray.length) for(const key of Object.keys(dataArray[0])) filterArray.push(key);
        let rows = () => {
            let array = [];
            for(let i = 0; i < dataArray.length; ++i){
                let row = array.push(
                    new Child("tr")
                        .setData({row:i+1})
                        .setStyle({})
                        .setShadowList([new Divider()])
                );
                for(let j = 0; j < filterArray.length; ++j){
                    row[i].childList.push(
                        new Child("td")
                            .setData({
                                cell: `${alphabet[j]}${i+1}`,
                                type: typeof dataArray[i][j],
                                value: dataArray[i][j],
                            })
                            .setInnerText(dataArray[i][j])
                    );
                }
            }
            return array;
        };
        this.tag = "md-table";
        this.childList = [
            new Child("table")
                .setChildList([
                    new Child("thead")
                        .setChildList([
                            new Child("tr")
                                .setChildList(filterArray.reduce((acc, cv, i) => {
                                    acc.push(new Child("td")
                                        .setData({
                                            cell: `${alphabet[i]}0`,
                                            type: typeof cv,
                                            value: cv
                                        })
                                        .setInnerText(cv));
                                },[]))
                        ]),
                    new Progress(0, true),
                    new Child("tbody").setChildList(rows())
                ])
        ]
    }
}