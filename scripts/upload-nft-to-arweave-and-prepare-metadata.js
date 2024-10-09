/* eslint-disable @typescript-eslint/no-var-requires */
const Irys = require('@irys/sdk');
const fs = require('fs');
const path = require('path');
const getArweaveKey = require('../utils/get-arweave-key.js');

// PARAMETERS -----------------
const nfts = [
  {
    metadataPath: path.resolve(__dirname, '../import/metadata/1.json'),
    imageFilePath: path.resolve(__dirname, '../import/images/1.jpeg'),
  },
  {
    metadataPath: path.resolve(__dirname, '../import/metadata/2.json'),
    imageFilePath: path.resolve(__dirname, '../import/images/2.jpeg'),
  },
];

const irysNode = 'https://node2.irys.xyz';

// END OF PARAMETERS DEFINITION

const getIrysArweave = async () => {
  const token = 'arweave';
  const key = getArweaveKey();

  const irys = new Irys({
    url: irysNode, // URL of the node you want to connect to
    token, // Token used for payment and signing
    key, // Arweave wallet
  });
  return irys;
};

const uploadImage = async (imageFilePath) => {
  const irys = await getIrysArweave();

  // Add a custom tag that tells the gateway how to serve this file to a browser
  const tags = [{ name: 'Content-Type', value: 'image/png' }];

  try {
    const response = await irys.uploadFile(imageFilePath, { tags });
    console.log(`Image file uploaded ==> https://gateway.irys.xyz/${response.id}`);
    return response.id;
  } catch (e) {
    console.log('Error uploading image file ', e);
    throw e;
  }
};

const uploadNFTMetadata = async (metadata) => {
  const irys = await getIrysArweave();

  // Add a custom tag that tells the gateway how to serve this file to a browser
  const tags = [{ name: 'Content-Type', value: 'application/json' }];

  try {
    const response = await irys.upload(Buffer.from(JSON.stringify(metadata)), { tags });
    console.log(`Metadata file uploaded ==> https://gateway.irys.xyz/${response.id}`);
    return response.id;
  } catch (e) {
    console.log('Error uploading metadata file ', e);
    throw e;
  }
};

async function main() {
  for (let i = 0; i < nfts.length; i = i + 1) {
    const { metadataPath, imageFilePath } = nfts[i];

    uploadImage(imageFilePath).then(async (imageHash) => {
      // read metadata file and convert it to object
      const metadata = JSON.parse(fs.readFileSync(metadataPath, { encoding: 'utf-8' }));

      // replace image field in metadata with the hash of the uploaded image
      const modifiedMetadata = {
        ...metadata,
        image: `ar://${imageHash}`,
      };

      await uploadNFTMetadata(modifiedMetadata);
    });
  }

  console.log('Done');
}

main();
