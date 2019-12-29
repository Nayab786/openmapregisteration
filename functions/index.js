//---------------------------------------------------------------------------------------------------------
//                        Importing Libraries And Files
//---------------------------------------------------------------------------------------------------------

const functions = require('firebase-functions');
const express = require('express');
const engines = require('consolidate');
var hbs = require('handlebars');
const app = express();
const cookieParser = require('cookie-parser');
app.engine('hbs', engines.handlebars);
app.set('views', './views');
app.set('view engine', 'hbs');
app.use(cookieParser());
const admin = require('firebase-admin');
const mailer = require("nodemailer");


//---------------------------------------------------------------------------------------------------------
//                        Initializing Firebase App And Email Services
//---------------------------------------------------------------------------------------------------------

// var serviceAccount = require("./iopposecaanrc-firebase-adminsdk-gsanh-db6882c78b.json");
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://iopposecaanrc.firebaseio.com"
// });

admin.initializeApp(functions.config().firebase);


// Use Smtp Protocol to send Email
const transporter = mailer.createTransport({
    service: "gmail",
    auth: {
        user: "downloadbooks786@gmail.com",
        pass: "Bapa@78692"
    }
});

//--------------------------------------------------------------------------------------------------------
//                       Function Declarations
//--------------------------------------------------------------------------------------------------------



/*-------------------    Getter Functions   ------------------------*/

//returns the database
async function getFirestore() {
    try {
        return await admin.firestore();
    }
    catch (err) {
        console.error(err);
        return null
    }

}

//returns collection
async function getCollection(db, collectionName) {
    try {
        return await db.collection(collectionName).get();
    }
    catch (err) {
        console.error(err);
        return null;
    }

}

//returns document
async function getDocument(db, collectionName, docName) {
    console.log("inside get document");
    try{
        const doc = await db.collection(collectionName).doc(docName).get();
        return doc.data();
    }
    catch(err){
        console.error(err);
        return null;
    }
    // await db.collection(collectionName).doc(docName).get().
    //     then(doc => {
    //         if (!doc.exists) {console.log("doc does not exist");return null;}
    //         else{ console.log("get document data"+JSON.stringify(doc.data())); return doc.data();}
    //     })
    //     .catch(err => { console.error('Error getting document', err); return null; });
}

//returns all documents
async function getAllDocuments(db, collectionName) {
    try {
        const snapshot = await getCollection(db, collectionName);
        return snapshot.docs.map(doc => doc.data());
    }
    catch (err) {
        console.error(err);
        return null;
    }
}

/*-------------------    Utility Functions   ------------------------*/
//returns a unique id
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

//generates email verification url
function generateVerificationUrl(request, id) {
    const host = request.get('host');
    return link = "http://" +"iopposecaanrc.firebaseapp.com" + "/verify?id=" + id;
}

//sends email
function sendEmail(transporter, mailOptions) {
    return transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error(error);
            return null;
        } else {
            console.log("email sent successfully")
            return info.response;
        }
    });
}

/*-------------------    Setter Functions   ------------------------*/

//inserts data into a collection
async function insertIntoDb(db, collectionName, docName, data) {
    var result = await db.collection(collectionName).doc(docName).set(data)
        .then(function () { console.log("Document successfully written!"); return true; })
        .catch(function (error) { console.error("Error writing document: ", error); });

    return result;
}

async function updateDocument(db, collectionName, docName, data) {
    console.log("Inside update document" + JSON.stringify(data));
    try {
        return   await db.collection(collectionName).doc(docName).set(data);
    }
    catch (err) {
        console.error(err);
        return null;
    }
}

//insert form data into database
async function insertFormData(db,request, id) {
    const protestor = {
        id: id,
        active: false
    }
    const location = {
        lat: request.body.lat,
        long: request.body.long
    }

    const doc = await getDocument(db, "__requestersProtesters98844", `${request.body.email}`);
    const exists = false;
    if (doc) {
        if (doc.active) {
            exists = true;
            console.log("document exists")
        }
    }
    if(!exists){
        console.log("document does not exists")
        var writeProtestor = await insertIntoDb(db,"__requestersProtesters98844", `${request.body.email}`, protestor);
        var writeProtestor = await insertIntoDb(db,"__rotesterRequester44889",`${id}`, {document: request.body.email});
        var writeLocation = await insertIntoDb(db,"__RequestersLocations8894", `${id}`, location);
    }

}


//--------------------------------------------------------------------------------------------------------------------------------
//              Handelling Requests
//--------------------------------------------------------------------------------------------------------------------------------

//insert data post request handler
app.post('/insert_data', async (request, response) => {
    const db = await getFirestore();
    const id = makeid(50);
    console.log(request.body.email);
    var insert = await insertFormData(db,request, id);

    var mailOptions = {
        from: "Books Download<downloadbooks786@gmail.com>",
        to: request.body.email,
        subject: "Send Email Using Node.js",
        text: "Node.js New world for me",
        html: `<b>Thanks for responding</b><br><p>Click the link to verify your email: ${generateVerificationUrl(request, id)}</p>`
    }
    var result = sendEmail(transporter, mailOptions);
    var data = {};
    response.render('maps', result);

});

app.get('/verify', async (request, response) => {
    console.log("got verification request");
    console.log("request is: " + request.query.id);
    const db = await getFirestore();
    const documentName = await getDocument(db, "__rotesterRequester44889", request.query.id);
    console.log(documentName.document);
    db_result = await insertIntoDb(db, "__requestersProtesters98844", documentName.document, {id:request.query.id, active:true});
    response.render('maps', { db_result });

});

//root get request handler
app.get('/', async (request, response) => {
    const db = await getFirestore();
    var db_result = await getAllDocuments(db, 'citizens');
    db_result = JSON.stringify(db_result);
    //const db_result = snapshot.docs.map(doc=>doc.data());
    //if(request)db_result.cookies = request.cookies;
    response.render('maps', { db_result });
});

//---------------------------------------------------------------------------------------------------------
//                        Launching App
//---------------------------------------------------------------------------------------------------------
exports.app = functions.https.onRequest(app);
