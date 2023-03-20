/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {

    async InitLedger(ctx) {
        const asset =
            {
                RecordID: '117238223',
                PatientID: 'gghg8uuuuh8h9',
                PatientName: 'hgfhhfghyhfgh',
                PatientDOB: '6ytryr6yr5yrt',
                AccessorID: ['Mark Wiliams', 'Tommy Insurance Company', 'Dr Patel'],
                MedicalRecords: ['9uvdghhr6yytd56ytthrt6y6yhgfththf','gdghtrh6yryrdth6ythfhd65ytrhhd6yh','hrtdu5llklklkl6yrgrtsydrthdytf'],
            };
         
	   //let recordID='gdg5ygtdghrty5yt';
        
            asset.docType = 'asset';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(asset.RecordID, Buffer.from(stringify(sortKeysRecursive(asset))));
        
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, recordID, patientID, patientName, patientDOB, accessorID, medicalRecords) {
        const exists = await this.AssetExists(ctx, recordID);
        if (exists) {
            throw new Error(`The asset ${recordID} already exists`);
        }

        const asset = {
                RecordID: recordID,
                PatientID: patientID,
                PatientName: patientName,
                PatientDOB: patientDOB,
                AccessorID: accessorID,
                MedicalRecords: medicalRecords,
            };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(recordID, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAssetBasedOnAccessorId(ctx, id, accessorID) {
        const assetString = await this.ReadAsset(ctx, id);
        if (assetString.length == 0){
            return "";
        }
        const asset = JSON.parse(assetString);
        if (asset.AccessorID.includes(accessorID)){
            return assetString;
        }
        else {
            return "";
        }
    }
    
    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, id, patientID, patientName, patientDOB, accessorID, medicalRecords) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
	const array_accessor = accessorID.split(",");
	const array_medical = medicalRecords.split(",");
	
        // overwriting original asset with new asset
        const updatedAsset = {
            RecordID: id,
            PatientID: patientID,
            PatientName: patientName,
            PatientDOB: patientDOB,
            AccessorID: array_accessor,
            MedicalRecords: array_medical,
    	};
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    async TransferAsset(ctx, id, newOwner) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldOwner;
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = AssetTransfer;
