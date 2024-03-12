/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const { config } = require('dotenv');

config();

function getArweaveKey() {
  // get key from env variable, with dotenv
  const key = JSON.parse(fs.readFileSync(process.env.ARWEAVE_KEY_PATH || '').toString());
  return key;
}

module.exports = getArweaveKey;
