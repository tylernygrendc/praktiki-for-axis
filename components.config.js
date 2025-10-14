import { writeFileSync } from "node:fs";
import chalk from "chalk";
// edit mdc object to reflect desired imports
const mdc = {
    button: {
        "elevated-button": false,
        "filled-button": true,
        "filled-tonal-button": false,
        "outlined-button": false,
        "text-button": true
    },
    checkbox: {
        checkbox: false
    },
    chips: {
        "assist-chip": false,
        "filter-chip": false,
        "input-chip": false,
        "suggestion-chip": false,
        "chip-set": false
    },
    dialog: {
        "dialog": true
    },
    divider: {
        "divider": false
    },
    elevation: {
        "elevation": false
    },
    fab: {
        "fab": true
    },
    focus: {
        "focus": false
    },
    icon: {
        "icon": true
    },
    iconbutton:{
        "icon-button": true,
        "outlined-icon-button": false,
        "filled-tonal-icon-button": false,
        "filled-icon-button": false
    },
    list: {
        "list-item": false,
        "list": false
    },
    menu: {
        "menu-item": false,
        "sub-menu": false,
        "menu": false   
    },
    progress: {
        "circular-progress": false,
        "linear-progress": false
    },
    radio: {
        radio: false
    },
    ripple: {
        "ripple": false
    },
    select: {
        "select-option": false,
        "filled-select": false,
        "outlined-select": false
    },
    slider: {
        "slider": false
    },
    switch: {
        "switch": false
    },
    tabs: {
        "primary-tab": false,
        "secondary-tab": false,
        "tabs": false
    },
    textfield: {
        "filled-text-field": false,
        "outlined-text-field": false
    }
}
try {
    console.log(chalk.yellow(`\nUpdating component import statements...`));
    writeFileSync(`./src/scripts/_components.mjs`, (()=>{
        return Object.entries(mdc).reduce((acc,[folder, files]) => {
            acc += Object.entries(files).reduce((acc,[file,used]) => {
                if(used) acc += `import "@material/web/${folder}/${file}.js";\n`;
                return acc;
            },"");
            return acc;
        },"");
    })(), (error) => {throw error;});
    console.log(chalk.greenBright(`\nUpdated _components.mjs !\n`));
} catch (error) {
    console.log(error);
    console.log(chalk.redBright(`\nFailed to update _components.mjs !\n`));
}