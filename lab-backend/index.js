'use strict';

const express = require('express'); // Using the express framework 
require("dotenv").config(); // Get environment variables from .env file(s)
var sqlite3 = require('sqlite3').verbose()
const cors = require('cors'); 
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');

const multer = require("multer");
var tempReportID = 0;
var fileID = 0;
var multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
      cb(null, tempReportID + '_' + fileID);
      fileID = fileID + 1;
    }
});
const upload = multer({storage: multerStorage});

const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../fabric-samples/test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../fabric-samples/test-application/javascript/AppUtil.js');


const channelName = 'channel1';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';

async function initializegateway() {
try {
		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg1);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(channelName);

			// Get the contract from the network.
			const contract = network.getContract(chaincodeName);
			
			} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
    } catch (error) {
		console.error(`******** FAILED to initialize hyperledgic gateway: ${error}`);
    }
}

initializegateway();
const DBSOURCE = "usersdb.sqlite";

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    } 
    else {        
        var salt = bcrypt.genSaltSync(10);
        //Add a field VisibleName (what will be shown in the update consent html), delete the Email field, delete Date fields
        db.run(`CREATE TABLE Users (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Username text, 
            Email text, 
            Password text,             
            Salt text,    
            Token text,
            DateLoggedIn DATE,
            DateCreated DATE
            )`,
        (err) => {
            if (err) {
                // Table already created
            } else{
                // Table just created, creating some rows
                var insert = 'INSERT INTO Users (Username, Email, Password, Salt, DateCreated) VALUES (?,?,?,?,?)'
                db.run(insert, ["user1", "user1@example.com", bcrypt.hashSync("user1", salt), salt, Date('now')])
                db.run(insert, ["user2", "user2@example.com", bcrypt.hashSync("user2", salt), salt, Date('now')])
                db.run(insert, ["user3", "user3@example.com", bcrypt.hashSync("user3", salt), salt, Date('now')])
                db.run(insert, ["user4", "user4@example.com", bcrypt.hashSync("user4", salt), salt, Date('now')])
            }
        });  
    }
  });

// --------------------- GENERAL SERVER FUNCTIONS ---------------------
var app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(
    cors({
        origin: 'http://localhost:3000'
    })
);

// Code to render dynamic HTML templates
app.set("view engine", "ejs")

app.listen(3000, () => {
    console.log("Server running on port 3000");
});


// --------------------- REST API RELATED FUNCTIONS ---------------------
app.post("/labapi/login", (req, res) => {
    const bodyContent = req.body;
    // variables from login form
    const username = bodyContent.username;
    const password = bodyContent.password;
    // redirect to report tracking site
    res.redirect('/trackreports/' + username)
});

app.get("/labapi/getreport/:reportID", function(req, res) {
    const reportId = req.params["reportID"];
    // REST call to the HF client <-- sample app served on another server
    res.json('Received request for reportID ' + reportId);
});

app.route("/labapi/submitreport")
    .post(upload.any(), (req, res, err) => {
        if (err) {
            console.log("Error uploading file " + err);
        }
        else {
            console.log(req.files);
            res.status(200).json({message: "Successfully Uploaded", status: 200});
        }
});

app.post("/labapi/consentupdate/:reportID", (req, res) => {
    const reportId = req.params["reportID"];
    const bodyContent = req.body;
    console.debug("Received consent update for reportID " + reportId);
    // client usernames is an iterable array that contains all the allowed accessor IDs or usernames
    console.debug("Received the following consented clients: " + bodyContent.clientUsernames)
    //if successful update of ledger, tell the patient that the consent was updated
    res.sendStatus(200);
});

// --------------------- RENDER RELATED FUNCTIONS ---------------------
// HTML rendering of websites through Embedded JavaScript Templates
app.get("/", (req, res) => {
    res.render("clientlogin");
});

app.get("/consentupdate/:reportID", (req, res) => {
    const reportID = req.params["reportID"];
    // TODO: get real list of clients and their visible names
    const clientsList = [{"clientUsername":"username1", "clientVisibleName":"Dr. Mike Hunt"}, {"clientUsername":"username2", "clientVisibleName":"Dr. Ben Dover"}, {"clientUsername":"username3", "clientVisibleName":"Neil Down Insurances"}]
    res.render("consentupdate", {reportID, clientsList});
});

app.get("/submitreport", (req, res) => {
    res.render("submitreport");
});

app.get("/success", (req, res) => {
    res.render("successaccessconsent");
});

// Function that handles rendering of report tracking for the client
app.get("/trackreports/:accessorID", (req, res) => {
    // example code to get several track reports dynamically updated
    // TODO: we need a function to gather this information from the blockchain
    const reports = [{"report_id":123, "patient_id":"ABC", "report_status":"Pending"}, {"report_id":456, "patient_id":"DEF", "report_status":"Ready"}, {"report_id":789, "patient_id":"GHI", "report_status":"Pending"}, {"report_id":101112, "patient_id":"ABC", "report_status":"Pending"}]
    const accessorID = req.params["accessorID"]

    res.render("trackreports", {reports, accessorID});
});