const express = require('express'); // Using the express framework 
require("dotenv").config(); // Get environment variables from .env file(s)
var sqlite3 = require('sqlite3').verbose()
const cors = require('cors'); 
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');

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