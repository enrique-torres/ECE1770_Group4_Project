/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const hyperlabsSecure = require('./lib/hyperlabsSecure');

module.exports.HyperlabsSecure = hyperlabsSecure;
module.exports.contracts = [hyperlabsSecure];
