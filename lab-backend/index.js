'use strict';

// Basic Web Server imports and global variables
const express = require('express'); // Using the express framework
require("dotenv").config(); // Get environment variables from .env file(s)
var sqlite3 = require('sqlite3').verbose()
const cors = require('cors'); 
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');

// Hyperledger imports and gobal variables
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');

const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../fabric-samples/test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../fabric-samples/test-application/javascript/AppUtil.js');
const { emitWarning } = require('process');

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
async function initializegateway() {
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

async function getrecordfromledger(recordid)
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

async function getrecordfromledgerwithaccessorid(recordid, accessorid)
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

async function updateledgerwithaccessorid(recordid, accessorid)
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

async function addledgerentry(recordid, accessorid, medicalrecordarray)
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

async function testconsent(){

    await updateledgerwithaccessorid('117238223', 'ajunnark');
    //console.log('*******to get record from ledger');
    getrecordfromledger('117238223');
}

initializegateway();

// LabClient user database
const DBSOURCE = "usersdb.sqlite";

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.log("Error opening db. The error is as follows:");
      console.error(err.message)
      throw err
    } 
    else {        
        var salt = bcrypt.genSaltSync(10);
        //Add a field VisibleName (what will be shown in the update consent html), delete the Email field, delete Date fields
        db.run(`CREATE TABLE Users (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Username text,
            Password text,             
            Salt text,
            Token text
            )`,
        (err) => {
            if (err) {
                // Table already created
                console.log("Users table is already created");
            } else{
                // Table just created, creating some rows
                var insert = 'INSERT INTO Users (Username, Password, Salt) VALUES (?,?,?)'
                db.run(insert, ["user1", bcrypt.hashSync("user1", salt), salt])
                db.run(insert, ["user2", bcrypt.hashSync("user2", salt), salt])
                db.run(insert, ["user3", bcrypt.hashSync("user3", salt), salt])
                db.run(insert, ["user4", bcrypt.hashSync("user4", salt), salt])
            }
        });  
    }
  });

module.exports = db;

// Setup express server
var app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(
    cors({
        origin: 'http://localhost:3000'
    })
);

// Code to render dynamic HTML templates
app.set("view engine", "ejs")

// Callback function to validate JWT token
const authenticateJWT = (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    req.user = decoded;
  } catch (err) {
    console.error("Could not validate JWT token. The error:");
    console.error(err);
    return res.status(401).send("Invalid Token");
  }
  return next();
};

module.exports = authenticateJWT;

// Lab backend URLs
app.post("/labClient/login", async (req, res) => {
    try {      
      const { username, password } = req.body;
          // Make sure there is an Email and Password in the request
          if (!(username && password)) {
              res.status(400).send("All input is required");
          }
              
          let user = [];
          
          var sql = "SELECT * FROM Users WHERE Username = ?";
          db.all(sql, username, function(err, rows) {
              if (err){
                  console.log(err);
                  res.status(400).json({"error": err.message})
                  return;
              }
  
              rows.forEach(function (row) {
                  user.push(row);                
              })
              
              var PHash = bcrypt.hashSync(password, user[0].Salt);
         
              if(PHash === user[0].Password) {
                  // * CREATE JWT TOKEN
                  const token = jwt.sign( {user_id: user[0].Id, username: user[0].Username }, process.env.TOKEN_KEY,
                      {
                        expiresIn: "1h", // 60s = 60 seconds - (60m = 60 minutes, 2h = 2 hours, 2d = 2 days)
                      }  
                  );
  
                  user[0].Token = token;
  
              } else {
                  return res.status(400).send("No Match");          
              }
  
             return res.status(200).send(user);                
          });	
      
      } catch (err) {
        console.log(err);
      }    
  });

app.post("/labClient/login/test", authenticateJWT, (req, res) => {
    res.status(200).send('Logged in!');
});

app.get("/labCLient/trackReports", authenticateJWT, (req, res) => {
    const username = req.user.username;
    res.json(`Tracking list of reports for labClient ${username}`);
});

app.get("/labCLient/getReport", authenticateJWT, function(req, res) {
    const reportId = req.query.reportId;
    const username = req.user.username;
    res.json(`Getting report: ${reportId} for labClient: ${username}`);
     
});

app.post("/lab/submitReport", (req, res) => {
    const bodyContent = req.body;
    const reportId = bodyContent.reportId;
    const reportContent = bodyContent.reportContent;
    res.json(`Submitted report to HF blockchain for reportId: ${reportId}`);
});

app.post("/patient/consentUpdate/<reportID>", (req, res) => {
    res.json(["Tony","Lisa","Michael","Ginger","Food"]);
});

// HTML rendering of websites through Embedded JavaScript Templates
app.get("/", (req, res) => {
    res.render("clientlogin");
});

app.get("/consentupdate", (req, res) => {
    testconsent();
    res.render("consentupdate");
});

app.get("/submitreport", (req, res) => {
    res.render("submitreport");
});

app.get("/success", (req, res) => {
    res.render("successaccessconsent");
});

app.get("/trackreports", (req, res) => {
    // example code to get several track reports dynamically updated
    const reports = [{"report_id":123, "patient_id":"ABC", "report_status":"Pending"}, {"report_id":456, "patient_id":"DEF", "report_status":"Ready"}, {"report_id":789, "patient_id":"GHI", "report_status":"Pending"}, {"report_id":101112, "patient_id":"ABC", "report_status":"Pending"}]

    res.render("trackreports", {reports});
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
 });
