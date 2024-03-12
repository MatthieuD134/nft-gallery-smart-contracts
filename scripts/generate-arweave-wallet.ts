import generateArweaveKey from '../utils/generate-arweave-key';

function main() {
  generateArweaveKey().then((key) => {
    console.log('Arweave key generated: ', JSON.stringify(key));
  });
}

main();
