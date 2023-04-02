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

const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../fabric-samples/test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../fabric-samples/test-application/javascript/AppUtil.js');


const channelName = 'channel1';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';
var gatewayinitialized = false;

// Create a new gateway instance for interacting with the fabric network.
// In a real application this would be done as the backend server session is setup for
// a user that has been verified.
const gateway = new Gateway();
let ccp = null;
let caClient = null;
let wallet = null;

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

async function initializegateway() {
try {
	// build an in memory object with the network configuration (also known as a connection profile)
	//const ccp = buildCCPOrg1();

	// build an instance of the fabric ca services client based on
	// the information in the network configuration
	//const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

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

async function getrecordfromledger(recordid)
{
	try {
		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);
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

var app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(
    cors({
        origin: 'http://localhost:3000'
    })
);

app.post("/labClient/login", (req, res) => {
    const bodyContent = req.body;
    const username = bodyContent.username;
    const passhash = bodyContent.passhash;
    res.json('Logged in for ${username}');
});

app.get("/labCLient/trackReports", (req, res) => {
    res.json(["Report1","Report2","Report3"]);
});

app.get("/labCLient/getReport/", function(req, res) {
    const reportId = req.query.reportId;
    // REST call to the HF client <-- sample app served on another server
    res.json('Received request for reportID ${reportId}');
    getrecordfromledger('117238223');
 
});

app.post("/lab/submitReport", (req, res) => {
    const bodyContent = req.body;
    const reportId = req.reportId;
    const reportContent = req.reportContent;
    res.json('Submitted report to HF blockchain for reportId: ${reportId}');
});

app.post("/patient/consentUpdate/<reportID>", (req, res) => {
    res.json(["Tony","Lisa","Michael","Ginger","Food"]);
});

app.listen(3000, () => {
 console.log("Server running on port 3000");
});
