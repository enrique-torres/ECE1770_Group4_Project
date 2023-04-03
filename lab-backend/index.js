'use strict';

// Basic Web Server imports and global variables
const express = require('express'); // Using the express framework 
require("dotenv").config(); // Get environment variables from .env file(s)
var sqlite3 = require('sqlite3').verbose()
const cors = require('cors');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');
const path = require('path');
const { emitWarning } = require('process');

// Hyperledger imports and gobal variables
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../fabric-samples/test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../fabric-samples/test-application/javascript/AppUtil.js');

const channelName = 'channel1';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';
var gatewayinitialized = false;


// Create a new gateway instance for interacting with the fabric network.
const gateway = new Gateway();
let ccp = null;
let caClient = null;
let wallet = null;

// File uploading imports and global variables
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
const upload = multer({ storage: multerStorage });

try {
	// build an in memory object with the network configuration (also known as a connection profile)
	ccp = buildCCPOrg1();

	// build an instance of the fabric ca services client based on
	// the information in the network configuration
	caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

} catch (error) {
	console.error(`******** create org: ${error}`);
}

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

//hyperledger functions
async function initializeGateway() {
	try {
		
		// setup the wallet to hold the credentials of the application user
		wallet = await buildWallet(Wallets, walletPath);
	
		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg1);
	
		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');
	
			
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
			console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
				await contract.submitTransaction('InitLedger');
				console.log('*** Result: committed');
			gatewayinitialized = true;
		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to initialize hyperledgic gateway: ${error}`);
	}
}

async function getRecordFromLedger(recordid)
{
	try {
		// setup the wallet to hold the credentials of the application user
		//const wallet = await buildWallet(Wallets, walletPath);
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
		console.log('\n--> Evaluate Transaction: ReadAsset, function returns an asset with a given reportID');
		let result = await contract.evaluateTransaction('ReadAsset', recordid);
		console.log(`*** Result: ${prettyJSONString(result.toString())}`);	
	
	} finally {
		// Disconnect from the gateway when the application is closing
		// This will close all connections to the network
		gateway.disconnect();
	}
}

async function getRecordFromLedgerWithAccessorID(recordid, accessorid)
{
	try {
		// setup the wallet to hold the credentials of the application user
		//const wallet = await buildWallet(Wallets, walletPath);
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
		console.log('\n--> Evaluate Transaction: ReadAsset, function returns an asset with a given reportID');
		let result = await contract.evaluateTransaction('ReadAssetBasedOnAccessorId', recordid, accessorid);
		console.log(`*** Result: ${prettyJSONString(result.toString())}`);	
	
	} finally {
		// Disconnect from the gateway when the application is closing
		// This will close all connections to the network
		gateway.disconnect();
	}
}

async function updateLedgerWithAccessorID(recordid, accessorid)
{
	try {
		// setup the wallet to hold the credentials of the application user
		//const wallet = await buildWallet(Wallets, walletPath);
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
		console.log('\n--> Submit Transaction: UpdateAsset recordid, recordid does not exist and should return an error');
	    await contract.submitTransaction('UpdateAssetWithAccessorId', recordid, accessorid);
		console.log('******** updated asset');	
	
	} finally {
		// Disconnect from the gateway when the application is closing
		// This will close all connections to the network
		gateway.disconnect();
	}
}

async function addLedgerEntry(recordid, accessorid, medicalrecordarray)
{
	try {
		// setup the wallet to hold the credentials of the application user
		//const wallet = await buildWallet(Wallets, walletPath);
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
		console.log('\n--> Submit Transaction: CreateAsset recordid,  if recordid exists return error');
	    await contract.submitTransaction('CreateAsset', recordid, accessorid, medicalrecordarray);
		console.log('******** created asset');	
	
	} finally {
		// Disconnect from the gateway when the application is closing
		// This will close all connections to the network
		gateway.disconnect();
	}
}


async function testConsent(){
    await updateLedgerWithAccessorID('117238223', 'ajunnark');
    //console.log('*******to get record from ledger');
    getRecordFromLedger('117238223');
}

initializeGateway();
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
				} else {
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
module.exports = db;
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

// Callback to handle JWT token and to validate it
const authenticateJWT = (req, res, next) => {
	const token =
		req.body.token || req.query.token || req.headers["x-access-token"];

	if (!token) {
		//var error_message = "A token is required for authentication";
		res.redirect("/" + "?error=1");
	}
	try {
		const decoded = jwt.verify(token, process.env.TOKEN_KEY);
		req.user = decoded;
	} catch (err) {
		console.error("Could not validate JWT token. The error:");
		console.error(err);
		//var error_message = "Invalid Token";
		res.redirect("/" + "?error=2");
	}
	return next();
};
module.exports = authenticateJWT;


// --------------------- REST API RELATED FUNCTIONS ---------------------
app.post("/labapi/login", async (req, res) => {
	try {
		const { username, password } = req.body;
		// Make sure there is an Email and Password in the request
		if (!(username && password)) {
			res.status(400).send("All input is required");
			return;
		}

		let user = [];

		var sql = "SELECT * FROM Users WHERE Username = ?";
		db.all(sql, username, function (err, rows) {
			if (err) {
				//var error_message = "Critical server error";
				console.log(err);
				res.redirect("/" + "?error=3");
				return;
			}

			rows.forEach(function (row) {
				user.push(row);
			})

			if (user.length == 0) {
				//var error_message = "User does not exist";
				console.log("User does not exist");
				res.redirect("/" + "?error=4");
				return;
			}

			var PHash = bcrypt.hashSync(password, user[0].Salt);

			if (PHash === user[0].Password) {
				// * CREATE JWT TOKEN
				const token = jwt.sign({ user_id: user[0].Id, username: user[0].Username }, process.env.TOKEN_KEY,
					{
						expiresIn: "1h", // 60s = 60 seconds - (60m = 60 minutes, 2h = 2 hours, 2d = 2 days)
					}
				);

				user[0].Token = token;

			} else {
				//var error_message = "Password is incorrect";
				console.log("Password is incorrect");
				res.redirect("/" + "?error=5");
				return;
			}

			// redirect to report tracking site
			res.redirect('/trackreports/' + username + "?token=" + user[0].Token);
			return;
		});

	} catch (err) {
		console.log(err);
	}
});

app.get("/labapi/getreport/:reportID", authenticateJWT, function (req, res) {
	const reportId = req.params["reportID"];
	// REST call to the HF client <-- sample app served on another server
	res.json('Received request for reportID ' + reportId);
	return;
});

app.route("/labapi/submitreport")
	.post(upload.any(), (req, res, err) => {
		if (err) {
			console.log("Error uploading file " + err);
			res.status(400).json({ message: "Error in upload", status: 400 });
			return;
		}
		else {
			console.log(req.files);
			res.status(200).json({ message: "Successfully Uploaded", status: 200 });
			return;
		}
	});

app.post("/labapi/consentupdate/:reportID", (req, res) => {
	const reportId = req.params["reportID"];
	const bodyContent = req.body;
	// TODO: Actually update consent
	testConsent();
	console.debug("Received consent update for reportID " + reportId);
	// client usernames is an iterable array that contains all the allowed accessor IDs or usernames
	console.debug("Received the following consented clients: " + bodyContent.clientUsernames)
	//if successful update of ledger, tell the patient that the consent was updated
	res.sendStatus(200);
	return;
});

// --------------------- RENDER RELATED FUNCTIONS ---------------------
// HTML rendering of websites through Embedded JavaScript Templates
app.get("/", (req, res) => {
	var errorCode = parseInt(req.query.error);
	var error = "";
	switch (errorCode) {
		case 1:
			error = "Session expired. Re-login is required";
			break;
		case 2:
			error = "Session error. Contact administrator";
			break;
		case 3:
			error = "Critical server error";
			break;
		case 4:
			error = "User does not exist";
			break;
		case 5:
			error = "Password is incorrect";
			break;
		default:
			break;
	}
	console.log(error);
	res.render("clientlogin", {errorMessage : error});
	return;
});

app.get("/consentupdate/:reportID", (req, res) => {
	const reportID = req.params["reportID"];
	// TODO: get real list of clients and their visible names
	const clientsList = [{ "clientUsername": "username1", "clientVisibleName": "Dr. Mike Hunt" }, { "clientUsername": "username2", "clientVisibleName": "Dr. Ben Dover" }, { "clientUsername": "username3", "clientVisibleName": "Neil Down Insurances" }]
	res.render("consentupdate", { reportID, clientsList });
	return;
});

app.get("/submitreport", (req, res) => {
	res.render("submitreport");
	return;
});

app.get("/success", (req, res) => {
	res.render("successaccessconsent");
	return;
});

// Function that handles rendering of report tracking for the client
app.get("/trackreports/:accessorID", authenticateJWT, (req, res) => {
	// example code to get several track reports dynamically updated
	// TODO: we need a function to gather this information from the blockchain
	const reports = [{ "report_id": 123, "patient_id": "ABC", "report_status": "Pending" }, { "report_id": 456, "patient_id": "DEF", "report_status": "Ready" }, { "report_id": 789, "patient_id": "GHI", "report_status": "Pending" }, { "report_id": 101112, "patient_id": "ABC", "report_status": "Pending" }]
	const accessorID = req.params["accessorID"]

	res.render("trackreports", { reports, accessorID });
	return;
});

// --------------------- API TEST FUNCTIONS ---------------------
app.post("/labapi/login/test", authenticateJWT, (req, res) => {
    res.status(200).send('Logged in!');
	return;
});
