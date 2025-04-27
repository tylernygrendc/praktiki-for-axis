export async function createSuperbill(patient, dateRange) {

    
    //!old code
    // access patient object
    const patient = new Patient();

    // validate startDate and endDate
    if(startDate instanceof Date === false) startDate = _.dateTime.presentYearStart;
    if(endDate instanceof Date === false) endDate = _.dateTime.endOfToday;

    // get all transactions and visits between startDate and endDate
    let transactions, visits;
    try{
        transactions = await axis.getTransactions(startDate, endDate);
        visits = await axis.getVisits(startDate, endDate);
    } catch (error) { 
        console.groupCollapsed(`Could not get superbill body.`);
        console.error(error);
        console.warn(`getSuperbillBody() returned an empty array instead.`);
        console.groupEnd();
        return []; 
    }

    // the statement body includes three lists: meta info, patient info, and an account summary

    // some of these list item values need to be calculated
    let paid = 0, billed = 0, refunded = 0;
    for(const transaction of transactions){
        if(transaction.status != "DECLINED") {
            if(transaction.type === "Refund/Void"){
                refunded +=  parseFloat(transaction.amount);
            } else if(transaction.type != "Refund/Void") {
                paid += parseFloat(transaction.amount);
                billed += parseFloat(transaction.amount);
            }
        }
    }

    // put these lists into an array for convenience
    let lists = [
        {   
            title: "Patient Information",
            content: [
                {label: "Name", value: `${patient.name.fullName}`},
                {label: "Date of Birth", value: `${_.dateTime.getNumberString(patient.dob)} (age ${patient.age})`},
                {label: "Address", value: `${patient.address.primary.street} ${patient.address.primary.city}, ${patient.address.primary.state} ${patient.address.primary.zip}`},
                {label: "Phone", value: `${patient.phone}`},
                {label: "Email", value: `${patient.email}`}
            ]
        },
        {   
            content: [
                {label: "Issue Date", value: _.dateTime.getNumberString(_.dateTime.startOfToday)},
                {label: "Period", value: `${_.dateTime.getNumberString(startDate)} - ${_.dateTime.getNumberString(endDate)}`},
                {label: "Reference Number", value: `${patient.name.initials}${_.dateTime.getNumberString(patient.dob,"mmddyyyy")}`},
                {label: "Prepared By", value: `${new Client().getCurrentUser(true)}`}
            ]
        },
        {
            title: "Account Summary",
            content: [
                {label: "Total Paid", value: _.showPlaceValues(paid, 2)},
                {label: "Total Billed", value: _.showPlaceValues(billed, 2)},
                {label: "Total Refunded", value: _.showPlaceValues(refunded, 2)},
                {label: "Total Visits", value: `${visits.length}`}
            ]
        }
    ];

    // the statement includes two separate tables: transaction history and visit history
    let transactionTableContent = [], problemTableContent = [], visitTableContent = [];
    // the content of these tables needs to be populated before a table can be generated
    for(const transaction of transactions){
        if(transaction.status === "DECLINED"){
            // do nothing
        } else {
            transactionTableContent.push({
                Date: _.dateTime.getNumberString(transaction.date_entered), 
                Purchase: transaction.product_purchased, 
                Method: transaction.cc_type === "Cash" ? "Cash" : `${transaction.cc_type} (${transaction.last_four})`, 
                Payment: transaction.type === "Refund/Void" ? "0.00" : transaction.amount, 
                Refund: transaction.type === "Refund/Void" ? transaction.amount : "0.00"
            });
        }
    }
    let problemList = []
    for(const visit of visits){
        for(const diagnosis of visit.diagnosis){
            if(!problemList.includes(diagnosis)){
                problemList.push(diagnosis);
                problemTableContent.push({
                    Diagnosis: diagnosis
                });
            }
        }
    }
    for(const visit of visits){
        visitTableContent.push({
            Date: _.dateTime.getNumberString(visit.date_entered), 
            Procedure: visit.procedure, 
            Charge: _.showPlaceValues(visit.visitCost, 2), 
            Physician: `${visit.users_tj_visits_2_name}, DC`, 
            Location: visit.tj_clinics_tj_visits_1_name
        });
    }

    // put these tables into an array for convenience
    let tables = [
        {
            title: "Transaction History",
            subtitle: "",
            content: transactionTableContent
        },
        {
            title: "Problem List",
            subtitle: "",
            content: problemTableContent
        },
        {
            title: "Visit History",
            subtitle: "",
            content: visitTableContent
        }
    ];

    // build the lists and tables
    // push their container objects to a body array
    let body = [];

    // build each list and push each container object to body
    for(const list of lists){
        // create the container object
        let container = new Child().setClassList(["superbill__list"]).appendTo();
        // append the title if supplied
        if(list.title != undefined) new Child("span").setClassList(["list__title"]).setInnerText(list.title).appendTo(container);
        // append the subtitle if supplied
        if(list.subtitle != undefined) new Child("span").setClassList(["list__subtitle"]).setInnerText(list.subtitle).appendTo(container);
        // append the list if supplied
        if(Array.isArray(list.content)) container.getNode().append(ui.build.list(list.content));
        // push the container to the body
        body.push(container);
    }

    // build each list and push each container object to body
    for(const table of tables){
        // create the container object
        let container = new Child().setClassList(["superbill__table"]).appendTo();
        // append the title if supplied
        if(table.title != undefined) new Child("span").setClassList(["table__title"]).setInnerText(table.title).appendTo(container);
        // append the subtitle if supplied
        if(table.subtitle != undefined) new Child("span").setClassList(["table__subtitle"]).setInnerText(table.subtitle).appendTo(container);
        // append the list if supplied
        if(Array.isArray(table.content)) container.getNode().append(ui.build.table(table.content));
        // push the container to the body
        body.push(container);
    }

    return body;
}