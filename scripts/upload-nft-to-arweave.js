/* eslint-disable @typescript-eslint/no-var-requires */
const Irys = require('@irys/sdk');
const getArweaveKey = require('../utils/get-arweave-key.js');

// type AttributeType = 'number' | 'date';

// interface IAttributeBase {
//   trait_type: string;
//   display_type?: AttributeType;
// }

// interface INumberAttribute extends IAttributeBase {
//   display_type: 'number';
//   value: number;
// }

// interface IDateAttribute extends IAttributeBase {
//   display_type: 'date';
//   value: Date;
// }

// interface IStringAttribute extends IAttributeBase {
//   value: string;
// }

// type IAttribute = INumberAttribute | IDateAttribute | IStringAttribute;

// PARAMETERS -----------------

const imageFilePath =
  '/Users/matthieudaulhiac/Documents/Projects/NFT-Gallery/nft-gallery-smart-contracts/import/test.jpeg';

const name = 'couverture alternative';
const description =
  "Couverture d'un comic imaginaire. Posseder ce NFT debloque egalement l'acces au chapitre 1 du Tome 1 de 'Nom du comic'.";
const attributes = [
  { trait_type: 'Tome', value: 1, display_type: 'number' },
  { trait_type: 'Chapitre', value: 1, display_type: 'number' },
  { trait_type: 'Comic', value: 'Nom du Comic' },
  { trait_type: 'Auteur', value: 'John Doe' },
];
const externalUrl = 'http://localhost:3000';

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

const uploadImage = async () => {
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

const uploadNFTMetadata = async (imageHash) => {
  const metadata = {
    name,
    description,
    image: `ar://${imageHash}`,
    attributes,
    external_url: externalUrl,
  };

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

function main() {
  uploadImage().then(async (imageHash) => {
    await uploadNFTMetadata(imageHash);
    console.log('Done');
  });
}

main();
