import Arweave from 'arweave';

function generateArweaveKey() {
  const arweave = Arweave.init({});

  return arweave.wallets.generate().then((key) => {
    return key;
    // {
    //     "kty": "RSA",
    //     "n": "3WquzP5IVTIsv3XYJjfw5L-t4X34WoWHwOuxb9V8w...",
    //     "e": ...
  });
}

export default generateArweaveKey;
