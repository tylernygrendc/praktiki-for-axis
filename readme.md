# Revised Workspace

Building a chrome extension as a single, large javascript file is a bad way of doing things. This revised workspace compiles modular `src` content to a compiled `dist` output. It is for a **very** specific application, but I'm building it with reusability in mind. This project may prove useful in other web applications where the majority of computing occurs on-device.

Please note: I am now using this revised workspace to build a project. I will be stopping direct work on this repository for now, but will copy over changes and new features as they come.

## Getting Started

Download the [latest release](https://github.com/tylernygrendc/revised-workspace.git/releases/tag/v0.10`) or clone this repository with:

`git clone https://github.com/tylernygrendc/revised-workspace.git`

From the revised workspace directory, run `npm install`. This system relies on [rollup](https://rollupjs.org/), [pug](https://pugjs.org), and [sass](https://sass-lang.com) for compiling to javascript, html, and css, respectively. 

## Core Concepts

It feels like you should be able to add HTML elements using the `HTMLElement` interface. Adding a list could be like this:

```
new HTMLUListElement(["Item #1", "Item #2",...]);
```

Of course, that's now how it works. This workspace **does** employ a that syntax, though. Here's how you make a list:

```
new List([
    new Li("Item"),
    new Li("Clickable Item").setListener("click",()=>{ /* do something */ }),
    new Li("Item with Link").setLink("www.github.com",true),
    "Item as String",...
]).appendTo(document.body);
```

The `Child` class is the foundation of this system. Create an element like this:

```
// index.js

import "./mdc/_core.js";
import {Child} from "./mdc/_core.js";

let exampleChild = new Child("h1")
    .setClassList(["child-example"])
    .setInnerText("This is an example element.")
    .appendTo(document.body);
```

As you can see, `Child` takes a single parameter that sets the tag name of the resultant DOM element. It defaults to `"div"`. In addition, every `new Child()` is assigned the following values.
```
{
    this.attributes = {};
    this.childList = [];
    this.classList = [];
    this.dataset = {};
    this.id = getRandomId();
    this.innerText = "";
    this.listeners = [];
    this.shadowRoot = {isAttached: false};
}
```

These values can be set directly (`new Child().classList = ["class-name"]`) or with an object method (`new Child().setClassList(["class-name"])`). Modifying `Child` with its methods is preferred in most cases. Methods on the `Child` class are:

|Method|Usage|Default|Returns|
|---|---|---|---|
|`appendTo(node\|Child\|string)`|`.appendTo(document.body)`|`getQueue()`[^1]|`this`|
|`exists()`|`.exists()`||`boolean`|
|`getNode(<any>fallback)`|`.getNode()`|`null`|`HTMLElement`|
|`setAttribute(object)`|`.setAttribute({role:"heading"})`|`{}`|`this`|
|`setAriaLabel(string)`|`.setAriaLabel("demo")`|`""`|`this`|
|`setChildList(array)`|`.setChildList([new Child()])`|`[]`|`this`|
|`setClassList(array)`|`.setClassList(["class-1"])`|`[]`|`this`|
|`setDataset(object)`|`.setDataset({example:"value"})`|`{}`|`this`|
|`setListener(<string>event, function)`|`.setListener("click",()=>{console.log("click")})`|`""`,`function(){}`|`this`|
|`setId(string)`|`.setId("demo")`|`getRandomId()`[^2]|`this`|
|`setInnerText(string)`|`.setInnerText("demo")`|`""`|`this`|
|`setShadowList(<Child>[]childArray,<string>mode,<boolean>clonable)`|`setShadowList([new Child()],"open")`|`{isAttached:true, mode:"open", clonable:false}`|`this`|
|`setStyle(object,<boolean>inline)`|`setStyle({translate:"-10%"},true)`|`{},false`|`this`|

## Components

The `Child` class is inherited by several higher-level components. These components are based on [material web](https://material-web.dev/) components (mdc) and more-or-less adhere to the [material design system](https://m3.material.io/). In addition to the methods on every `Child`, certain components have methods that expand functionality and appearance. Notably, these are independent of the methods that exist on DOM elements (although these still can be used). Here are the most common component methods:

|Method|Returns|
|---|---|
|`getSelection()`|An array representing user input.[^3]|
|`setLink(<string>href,<boolean>openInNewWindow)`|`this` object.|

To use a component, you must import it. That import needs to look like this[^4] because of some [material web](https://material-web.dev/) funkiness:

```
// index.js
import "./mdc/_checklist";
import { Checklist, Checkbox } from "./mdc/_checklist.js";
```

Several core components are included within `mdc/_core.js`. These are `Child`, `Details`, `Divider`, `Form`, `Icon`, `Iconbutton`, `Img`, `Link`, `Picture`, and `Progress`. Other available components are:

|Component(s)|Location|
|---|---|
|`Button`|`mdc/_button.js`|
|`Checklist`,`Checkbox`, `Radiolist`,`Radio`, `Switchlist`,`Switch`|`mdc/_checklist.js`|
|`Chiplist`,`Chip`|`mdc/_chip.js`|
|`Dialog`|`mdc/_dialog.js`|
|`FAB` (floating action button)|`mdc/_fab.js`|
|`List`,`Li`|`mdc/_list.js`|
|`Menu`,`Submenu`,`Mi`|`mdc/_menu.js`|
|`Select`|`mdc/_menu.js`|
|`Sheet`|`mdc/_sheet.js`|
|`Slider`,`Range`|`mdc/_slider.js`|
|`Tablet`,`Tabs`,`Tab`,`Panel`|`mdc/_tabs.js`|
|`Textfield`|`mdc/_textfield.js`|

### Design System Styles

An `mdc` folder also exists within `src/styles` and contains the styles for each component.[^5] Notably, `theme.scss` and `typescale.scss` live outside of this folder because they are available at the `:root`/`:host` level. Create a custom theme using [material-web.dev](https://material-web.dev/).

### Design System Symbols

Material symbols are also kept separately, this time in `dist/assets`. You shouldn't need to touch the `dist` folder very often, only when updating `manifest.json` or adding static assets like images. To package only essential symbols, edit the `symbols` array within `symbols.config.js` and run `node symbols.config.js` from the command line.

## Development

Use `npm run compile` to generate `dist` content from the `src` directory. Alternatively, CSS, JavaScript, and HTML can complied independently, with or without the `--watch` flag:

|Output|Command|With --watch (optional)|
|---|---|---|
|.js|`npm run rollup`|`npm run rollup -- -w`|
|.css|`npm run sass`|`npm run sass -- -w`|
|.html|`npm run pug`|n/a|

## Production

Before shipping your application:

- [ ] Modify and run `node symbols.config.js`.

- [ ] Update dependencies with `npm install`.

- [ ] Confirm that `dist/manifest.json` is up-to-date.

Then use `npm run deploy` to generate production ready `dist` content from the `src` directory, and use `npm run compress` to compress the `dist` directory to `dist.zip`.

[^1]: `getQueue()` references (or creates) a node containing elements that have not yet been moved to their final position. This isn't absolutely necessary, but helps to prevent layout shift.
[^2]: `getRandomId()` returns a random string suitable for uniquely identifying an html element. It's just a container for `crypto.getRandomValues()`.
[^3]: This method is not yet implemented.
[^4]: The second import statement allows for intellisense within the IDE. It's technically unnecessary, but it is helpful.
[^5]: Only *some* components-- core material web styles (from Google) exist within `node_modules/@material/web/*`.