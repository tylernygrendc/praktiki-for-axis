import { writeFileSync } from "node:fs";
import chalk from "chalk";
// edit mdc object to reflect desired imports
const mdc = {
    button: {
        "elevated-button": true,
        "filled-button": true,
        "filled-tonal-button": true,
        "outlined-button": true,
        "text-button": true
    },
    checkbox: {
        checkbox: true
    },
    chips: {
        "assist-chip": true,
        "filter-chip": true,
        "input-chip": true,
        "suggestion-chip": true,
        "chip-set": true
    },
    dialog: {
        "dialog": true
    },
    divider: {
        "divider": true
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
        "outlined-icon-button": true,
        "filled-tonal-icon-button": true,
        "filled-icon-button": true
    },
    list: {
        "list-item": true,
        "list": true
    },
    menu: {
        "menu-item": false,
        "sub-menu": false,
        "menu": false   
    },
    progress: {
        "circular-progress": true,
        "linear-progress": true
    },
    radio: {
        radio: true
    },
    ripple: {
        "ripple": false
    },
    select: {
        "select-option": true,
        "filled-select": false,
        "outlined-select": true
    },
    slider: {
        "slider": true
    },
    switch: {
        "switch": true
    },
    tabs: {
        "primary-tab": true,
        "secondary-tab": true,
        "tabs": true
    },
    textfield: {
        "filled-text-field": false,
        "outlined-text-field": true
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
    console.log(chalk.greenBright(`\n_components.mjs has been successfully updated!\n`));
} catch (error) {
    console.log(error);
    console.log(chalk.redBright(`\nFailed to update _components.mjs !\n`));
}