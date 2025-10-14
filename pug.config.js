import {writeFileSync, readdirSync} from "node:fs"
import chalk from "chalk";
import * as pug from "pug";

const [inputDirectory, outputDirectory] = [`./src/templates`, `./dist/markup`];

const templates = readdirSync(inputDirectory);
const existingHTML = readdirSync(outputDirectory);

console.log(chalk.yellow(`Rendering HTML from "${inputDirectory}"...\n`));

for(const template of templates) {
    if(template.charAt(0) === "_" || !template.includes(".pug") ) {
        // it's a module/folder, do nothing
    } else {
        const html = `${template.split(".")[0]}.html`;
        writeFileSync(`${outputDirectory}/${html}`, 
                pug.renderFile(`${inputDirectory}/${template}`, {
                title: template.split(".")[0],
                production: false
            }));
        console.log(`${template} => ${html} (${existingHTML.includes(html) ? "updated" : "new"})`);
    }
}
console.log(chalk.yellow(`\nOutput to ${outputDirectory}/`));
console.log(chalk.greenBright("\nPug rendering complete!\n"));