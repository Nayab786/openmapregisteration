const functions = require('firebase-functions');
const express = require('express');
const engines = require('consolidate');
var hbs = require('handlebars');

const admin = require('firebase-admin');
const app = express();
const cookieParser = require('cookie-parser');
app.engine('hbs', engines.handlebars);
app.set('views', './views');
app.set('view engine', 'hbs');
app.use(cookieParser());


// var serviceAccount = require("./iopposecaanrc-firebase-adminsdk-gsanh-db6882c78b.json");
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://iopposecaanrc.firebaseio.com"
// });

admin.initializeApp(functions.config().firebase);

async function getFirestore() {
    const firestore_con = await admin.firestore();
    const writeResult = firestore_con.collection('citizens').doc('pNOP8nJmrgGYnAGEdVAv').get().then(doc => {
        if (!doc.exists) { console.log('No such document!'); }
        else { return doc.data(); }
    }).catch(err => { console.log('Error getting document', err); });
    return writeResult
}

async function insertFormData(request) {
    //console.log(JSON.stringify(request));
    const location = {
        lat: request.body.firstname,
        long: request.body.lastname
    }
    
    const writeResult = await admin.firestore().collection('citizens').doc(`${location.lat+location.long}`).set(location)
        .then(function () { console.log("Document successfully written!");} )
        .catch(function (error) { console.error("Error writing document: ", error); });
}

app.post('/insert_data', async (request, response) => {
    
    var insert = await insertFormData(request);
    response.cookie('id', '1234') ;// options is optional
    response.send('');
    var data = {};
    response.render('req',data);
    
});

app.get('/', async (request, response) => {
    var db_result = await getFirestore();
    db_result.cookies = request.cookies;
    response.render('index', { db_result });
});
exports.app = functions.https.onRequest(app);
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
