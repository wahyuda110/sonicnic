const fs = require('fs');
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

function generateSolanaKeys(count) {
  const keyPairs = [];
  for (let i = 0; i < count; i++) {
    const keypair = Keypair.generate();
    const privateKey = bs58.encode(keypair.secretKey);
    const publicKey = keypair.publicKey.toBase58();
    keyPairs.push({ privateKey, publicKey });
  }
  return keyPairs;
}

const numberOfKeys = 300;
const outputPrivateKeyFile = 'privatekeygenerate.txt';
const outputPublicKeyFile = 'pubkeygenerate.txt';

try {
  const keyPairs = generateSolanaKeys(numberOfKeys);
  const privateKeysData = keyPairs.map(pair => pair.privateKey).join('\n') + '\n';
  const publicKeysData = keyPairs.map(pair => pair.publicKey).join('\n') + '\n';

  // Perbaiki penulisan path file untuk private keys
  fs.writeFileSync(outputPrivateKeyFile, privateKeysData, { flag: 'a' }); 
  console.log(`Generated ${numberOfKeys} private keys and appended to ${outputPrivateKeyFile}`);

  // Perbaiki penulisan path file untuk public keys
  fs.writeFileSync(outputPublicKeyFile, publicKeysData, { flag: 'a' });
  console.log(`Generated ${numberOfKeys} public keys and appended to ${outputPublicKeyFile}`); 

} catch (error) {
  console.error('Error:', error.message);
}
