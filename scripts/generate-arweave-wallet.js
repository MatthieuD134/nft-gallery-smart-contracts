// eslint-disable-next-line @typescript-eslint/no-var-requires
const generateArweaveKey = require('../utils/generate-arweave-key.js');

function main() {
  generateArweaveKey().then((key) => {
    console.log('Arweave key generated: ', JSON.stringify(key));
  });
}

main();
