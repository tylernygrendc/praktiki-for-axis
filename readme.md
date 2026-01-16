# Praktiki for AXIS

[The AXIS Extension](https://www.github.com/tylernygrendc/the-axis-extension) introduced new functionality to [The Joint's](https://www.thejoint.com/our-story) combined health record and customer management system, called AXIS. The scope of that project, however, was limited to front-of-house automation. Praktiki for AXIS (Praktiki) is a revitalized effort at reshaping medical documentation within the The Joint's clinic system. It is intended to replace The AXIS Extension.

Like it's predecessor, Praktiki is a browser extension compatible with Chrome, Edge, Opera, Brave, and Vivaldi ^[A fork of this project will be available for use with Firefox]. It is built with pure JavaScript and utilizes [Rollup](https://rollupjs.org/) to compile scripts to `dist/scripts`. Stylesheets are written with [SCSS](https://sass-lang.com/) and complied to `dist/styles`. HTML is written with [Pug](https://pugjs.org/api/getting-started.html) and compiled to `dist/markup`. It is built with [Material Web](https://material-web.dev) and adheres to the [Material Design System](https://m3.material.io/).

## Architecture

AXIS consists of two discrete web applications: _back office_ and _front office_. These are assigned the subdomains _backoffice_ and _axis_, respectively. Praktiki provides a uniform interface that automates clicks and requests on behalf of the AXIS user. It also serves as a bridge between to the two systems.

Praktiki's content script creates an `User` instance at `document_idle`. This is a JavaScript class that represents the current signed-in user, their current clinic, and it contains an `App` instance that represents the current webpage and extension UI.

### Printing Documents

`App.printPreview(doc<Element>, options<obj>)` creates a `<praktiki-print-preview>` web component, an extension of the `HTMLIFrameElement`, to which an `Element` is appended. User `click` on any `<td>`, `<p>`, `<h[1-6]>`, or `<span>` will allow for direct edit of any preview text, which may be optionally disabled by passing `allowEdit: false` to `options`. 

The `<praktiki-print-preview>` web component is contained within an `<md-dialog>` with options to "print", "save", and "save and print" by default. The dialog can also be closed and preview removed without initiating an action. Passing `{save: false}` limits the options to just "print" by disabling the corresponding buttons. Passing options `{save: false, allowEdit: false}` bypasses the `<md-dialog>` altogether, calling `PraktikiPrintPreview.print()` immediately and removing `<praktiki-print-preview>` from the DOM `afterprint`.

"Print" calls `MDPrintPreview.print()`, triggering the browser's native print preview and removing `<praktiki-print-preview>` from the DOM `afterprint`. "Save and print" calls `App.uploadToDocuments()` `afterprint` and modifies the DOM to show _in progress_ and _complete_ states before removing `<praktiki-print-preview>`.

### Saving Documents

`App.uploadToDocuments()` takes an `HTMLElement` (the `<praktiki-print-preview>` web component) and converts it to PDF using [html2pdf.js](https://www.npmjs.com/package/html2pdf.js/v/0.9.0). The `output()` method can be used to create a `blob` for upload via `fetch()`. 

```
html2pdf().from(PraktikiPrintPreview).set({
  margin: 1,
  jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
}).output("blob", {filename: "filename.pdf"}, "pdf").then(async (blob) => {
    try{
        let res = await fetch("https://axis.thejoint.com/rest/v11_24/Documents/temp/file/filename", {
            method: "POST",
            body: blob,
        });
    } catch (error) {
        ...
    }
});
```

The contact record must also be updated after document each upload.

```
const res = await fetch(https://axis.thejoint.com/rest/v11_24/Contacts/{patient-id}/link/documents, {
    method: "POST",
    body: {
        deleted: false,
        doc_type: "Sugar",
        revision: 1,
        is_template: false,
        clinicname_c: false,
        is_incorrect_c: false,
        assigned_user_id: "user-id",
        category_id: "Other",
        subcategory_id: "Other",
        "filename": "filename.pdf",
        "document_name": "filename.pdf",
        "description": "File description...",
        "filename_guid": "filename-guid"
    }
});
```

This call may also be used to correct the document's category, subcategory, description, name, or status (`is_incorrect_c: true`).

### Extension UI

Print options (and most other features) are accessible inside of an `<md-sheet>` element at the right side of the viewport. This sheet is injected immediately with `content.js` and is customized to the given `App.name` and `App.resource`.

### Alerts at a glance

In a pending visit, and on a patient profile, certain patient account flags will appear at the top of the `<md-sheet>`. These include:

- Medicare Eligible
- Forms Due (includes ABN, Wellness Review, Intake)
- Payment Due
- Treatment Restriction
- New Patient

A detailed description of the flags will appear underneath. Flags related to the patient's account (forms/payment due) are linked to their corresponding _front office_ resource.

### Medical Documentation

In a pending visit, the `<md-sheet>` is populated with input components specifying:

- visit type (slider; active care, maintenance)
- reason for visit (problem list; editable)*
- patient-reported progress (slider; better, same, worse)*
- new injury or complication (chipset)
- patient-reported adverse events (chipset)
- differential diagnosis (checklist, hidden by default)*
- phase of care (relief, recovery, wellness)*
- care plan compliance (yes/no)*
- care plan modifications (home instructions)*

The visit type selector will be a horizontal slider. Selecting maintenance will prompt the user to resolve all problems, and will hide all starred (*) elements (see above).

The problem list is presented as a table and allows for the specification of name, onset (acute, chronic; traumatic, non-traumatic; sudden, gradual, persistent), severity (0-10), disability (same as intake), category (subclinical, mild, moderate, severe), and previous provider (MD, DO, PT, DC, RN, PA, other, none). Problems can be removed individually or in bulk, with valid removal reasons consisting of:

- resolved through treatment
- resolved naturally
- resolved through care of another provider
- assigned to another provider
- replaced with a new problem
- reached maximum improvement
- problem has... [other]
- added in error

The user will have the option to quick-add new minor problems/complications that do not change the current care plan (ie "recently sick," "sore after exercise", etc). This will consist of a `input[type=checkbox]`, `label`, and adjacent `md-chip-set` containing common entires. When `checked`, a `textarea` will be prepended to allow for detailed entry. Adverse events can be reported via a similar interface. 

For exam visits, a differential diagnosis is presented as a checklist based on the listed problem. For multiple problems, multiple checklists are presented as a series of tabs and tab panels. For treatment visits is, an uneditable list of prior diagnoses is presented.

These input components directly modify the properties of `BackOfficePatient`. When the `subjective()` method is called, these properties (and others on the object) are used to compose a narrative string. For example:

> This 26 year old male presents for evaluation and management of acute low back pain that began suddenly while lifting his daughter two days ago. He reports prior low back pain, but says this problem is unique in quality and severity. Pain improves with the use of ice and stretching, and worsens with bending and twisting. Sharp pain occurs at the right side of the low back, with numbness and tingling affecting the right posterior thigh. It does not cross the knee, and there is no loss of strength. This problem has remained constant since onset. 

The `value` of `<textarea id="subjective">` in AXIS is then set to the value of this string. This automatically generated text will update to reflect changes to input components within both Praktiki and AXIS. The user can also add and modify this text directly. This system also applied to the objective, assessment, and plan fields within AXIS.

#### Resolving Automatic and User Generated Text

To avoid collisions between automatic and user generated text, each `textarea` will be monitored for `keydown` events where characters are manually added to, or removed from, `textarea.value`. Changes to each `textarea` will be tracked with the `App` instance. `App.axis.ui.soap` will be assigned `subjective`, `objective`, `assessment`, and `plan` properties with the following structure. 

```
subjective: {
    1: {
        substring: "Knock knock" // sentence #1,
        isUserEdited: false,
        isSystemEdited: true,
        indexStart: 0,
        indexEnd: 10,
        category: "prompt"
        subcategory: null,
        priority: 1
    },
    2: {
        substring: "Who's there?" // sentence #2
        isUserEdited: true,
        isSystemEdited: false,
        indexStart: 11,
        indexEnd: 23,
        category: "freeform",
        subcategory: null,
        priority: 1
    }
    ...
}
```

This effectively flags individual sentences within `value` as "do not modify automatically" if they have been directly written or modified by the user. As implied in the previous JSON structure, Praktiki will set `isSystemEdited` to `true` when adding or modifying sentences.

These objects, representing each sentence, can added by Praktiki directly and will be automatically added when the `keydown` event `key` is ".", "?", ";", or "!". Likewise, a sentence object will be removed when the corresponding ".", "?", ";", or "!" is removed.

To determine the identity of a removed character, `value` will be compared across `keydown` and `keyup` events. To determine which sentence is being modified, `selectionStart` and `selectionEnd` will be compared to the `indexStart` and `indexEnd` of each sentence.

New sentences added by Praktiki will be appended to `value`. Praktiki may use `category`, `subcategory`, and `priority` sort and maintain logical sentence order.

### Adding an Exit Button

In a pending visit, Praktiki hides the built-in "Save" and "Complete" buttons in favor of custom "Exit", "Save", and "Complete" buttons.
