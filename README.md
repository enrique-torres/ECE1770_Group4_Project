# University of Toronto ECE1770 Group 4 Project - Secure Consent Model on Blockchain for Sensitive Medical Records
## Motiviation, scope and high level design of the project
Access to sensitive medical records is crucial for providing appropriate medical care to patients. However, in the current healthcare system, the sharing of medical records between healthcare providers and third parties (e.g. insurance companies) can be a slow and complicated process that often involves multiple intermediaries. This can result in data breaches, unauthorized access, and medical identity theft. Just last May, there was a data breach at Scarborough Health Network where sensitive patient data such as lab results, personal information and immunization records was accessed unauthorizedly. In a survey conducted by Black Book Market Research LLC in 2019, healthcare providers were identified as the most targeted organizations for industry cybersecurity breaches with over 93% of healthcare organizations having experienced a data breach since Q3 2016 and 57% having more than five data breaches during the same timeframe. \ul{This has led to a growing concern about data privacy and security, as well as the need for efficient and secure methods for sharing medical records.}

In this project, we have developed a secure consent model based on blockchain that will allow patients to control the access and retrieval of their sensitive medical records. By leveraging the distributed nature of blockchain, a secure and transparent system for managing medical records can be created, which eliminates the need for intermediaries and ensures that medical records are secure, private, and accessible only to authorized parties. Patients can provide explicit and informed consent for the sharing of their medical records, and healthcare providers/third parties can access the records only when authorized by the patient. This will ensure that patient data is secure and private, and will also provide a more efficient and cost-effective solution overall.

To achieve this secure consent model, we have developed and deployed the following elements in our application:
 - Deployed a HyperLedger Fabric blockchain system and implemented chaincode in NodeJS to transparently store encrypted medical records alongside access consent information as provided by the patient
 - Developed a secure backend HTTP server that connects the frontend application to the HyperLedger Fabric via NodeJS. The backend is responsible for handling the authentication logic, the patient consent logic, the encryption and decryption logic and the medical record submission and download logic.
 - Finally, we developed an easy to use frontend application based on HTML and JavaScript to allow Lab-produced medical records to be submitted to the secure consent model, allow patients to update their access consent for their medical records, and allow consented accessors to view their patient's medical records in a secure fashion.

## Repository contents
This repository contains the HyperLedger Fabric setup for our project, as well as the chaincode, the implemented backend and the frontend application. The repository is structured as follows:
 - The folder fabric-samples contains example HyperLedger Fabric example chaincodes and applications, as well as our chaincode and business logic in directory named asset-transfer-basic/chaincode-javascript-consensus-project.
 - The folder lab-backend contains the NodeJS backend, which is structured as follows: index.js is the main application script, which opens the HTTP server and also handles all the logic connections between frontend and the HyperLedger Fabric.
 - The frontend application can be viewed in two folders. The main folder is inside the lab-backend folder, under the views folder. This folder contains the dynamic Embedded JavaScript Templates files, which are generated on response time by the backend with all the information that is gathered from both the backend database and the blockchain. The other frontend folder, frontend-raw which can be found on the root of the repository, is the template HTML, CSS and JavaScript code as it was originally designed prior to modifying it with the dynamic template generation.

## Installation requirements and setup

After cloning the repository certain pre-requisites need to be installed in Ubuntu

### install curl and docker compose
*sudo apt-get install curl*  
*sudo apt-get -y install docker-compose*  

*sudo systemctl start docker*  
*sudo systemctl enable docker*  
*sudo usermod -a -G docker* **user**  

*sudo apt-get update*  

### install golang
*cd ~/Desktop/*  
*curl -O https://dl.google.com/go/go1.18.3.linux-amd64.tar.gz*  
*tar xvf go1.18.3.linux-amd64.tar.gz*  
*export GOPATH=$HOME/go*  
*export PATH=$PATH:$GOPATH/bin*  

### install jq
*sudo snap install jq*  

### install nodeJS version 16
*curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -*  
*sudo apt-get install -y nodejs*  

### test installing node modules for our chaincode assuming the project is in ~/Desktop/hyperledger directory
*cd ~/Desktop/hyperledger/ECE1770_Group4_Project/fabric-samples/asset-transfer-basic/chaincode-javascript-consensus-project/*  
*npm install*  

### ensure all project directories are owned by current user and not root
*cd ~/Desktop*  
*sudo chown -R* **user**:**user** *hyperledger/*  


### bring up the fabric test network with two peer endorsing nodes belonging to different organizations and one ordering node and create private channel channel1 between them
*cd ~/Desktop/hyperledger/ECE1770_Group4_Project/fabric-samples/test-network*  
*./network.sh up createChannel -c channel1 -ca*  

### add bin and config to PATH 
*export FABRIC_CFG_PATH=$PWD/../config/*  
*cd ~/Desktop/hyperledger/ECE1770_Group4_Project/fabric-samples/bin*
*export PATH=${PWD}:$PATH*  

### package chaincode 
*peer lifecycle chaincode package basic.tar.gz --path ~/Desktop/hyperledger/ECE1770_Group4_Project/fabric-samples/asset-transfer-basic/chaincode-javascript-consensus-project/ --lang node --label basic_1.0*  
*. ./scripts/envVar.sh*  

### install chaincode on endorsing node 1
*setGlobals 1*  
*peer lifecycle chaincode install basic.tar.gz*  

### install chaincode on endorsing node 2
*setGlobals 2*  
*peer lifecycle chaincode install basic.tar.gz*  

### query PKGID of installed chaincode
*setGlobals 1*  
*peer lifecycle chaincode queryinstalled --peerAddresses localhost:7051 --tlsRootCertFiles organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt*  

### the PKGID below should match the output you got from previous command this ID is different everytime
*export PKGID=basic_1.0:1aa1cf5818c12a8f35031f98ab18785cb0a0b17174f1ee6af587a6a670a4f761*  

### approve chaincode on node 1
*peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $PWD/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem --channelID channel1 --name basic --version 1 --package-id $PKGID --sequence 1*  


### approve chaincode on node2
*setGlobals 2*  

*peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $PWD/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem --channelID channel1 --name basic --version 1 --package-id $PKGID --sequence 1*  

### commit chaincode
*peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $PWD/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem --channelID channel1 --name basic --peerAddresses localhost:7051 --tlsRootCertFiles $PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles $PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt --version 1 --sequence 1*  

*peer lifecycle chaincode querycommitted --channelID channel1 --name basic --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem*  

## Executing our project and replicating our results
TODO

## Performance evaluation results
TODO
