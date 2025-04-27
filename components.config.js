import { appendFileSync, writeFileSync } from "node:fs";
import chalk from "chalk";

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
        "focus": true
    },
    icon: {
        "icon": true,
        "filled-icon-button": false,
        "filled-tonal-icon-button": false,
        "icon-button": true,
        "outlined-icon-button": false
    },
    list: {
        "list-item": true,
        "list": true
    },
    menu: {
        "menu-item": true,
        "sub-menu": true,
        "menu": true   
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
}, 
wc = {
    check: {
        "check-item": true,
        "check-list": true
    },
    radio: {
        "radio-item": true,
        "radio-list": true
    },
    sheet: {
        "sheet": true,
    },
    snackbar: {
        "snack-bar": true
    },
    switch: {
        "switch-item": true,
        "switch-list": true
    },
    tabs: {
        "tablist": true,
        "tab-panel": true
    }
}, 
mdDir = "@material/web",
wcDir = "./src/scripts/components/custom-elements";

function web(components, path) {
    let content = "";
    for(const [folder, files] of Object.entries(components))
        for(const [file,used] of Object.entries(files))
            if(used) content += `import "${path}/${folder}/${file}.js";\n`;
    return content;
}

try {
    console.log(chalk.yellow(`\nUpdating component import statements...`));
    writeFileSync(`./src/scripts/web-components.js`, web(mdc, mdDir), (error) => {throw error;});
    appendFileSync(`./src/scripts/web-components.js`, web(wc, wcDir), (error) => {throw error;});
    console.log(chalk.greenBright(`\nUpdated web-components.js !\n`));
} catch (error) {
    console.log(error);
    console.log(chalk.redBright(`\nFailed to update web-components.js !\n`));
}