import * as fs from 'fs';
import { config as dotEnvConfig } from 'dotenv';

dotEnvConfig();

function getArweaveKey() {
  // get key from env variable, with dotenv
  const key = JSON.parse(fs.readFileSync(process.env.ARWEAVE_KEY_PATH || '').toString());
  return key;
}

export default getArweaveKey;
