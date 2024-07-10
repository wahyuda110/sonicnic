const { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair } = require('@solana/web3.js');
const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');
const bs58 = require('bs58');
const axios = require('axios');
require('dotenv').config();

const DEVNET_URL = 'https://devnet.sonic.game/';
const connection = new Connection(DEVNET_URL, 'confirmed');

const TELEGRAM_BOT_TOKEN = '7151904242:AAHY9qOmi780I0TxN1AK26u9dbWg0PnKzvs'; // Replace with your bot token
const TELEGRAM_CHAT_ID = '479770270'; // Replace with your chat ID

async function sendMessageToTelegram(message) {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    });
  } catch (error) {
    console.error('Failed to send message to Telegram:', error);
  }
}

async function sendSol(fromKeypair, toPublicKey, amount) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: toPublicKey,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );
  const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
  return signature;
}

function generateRandomAddresses(count) {
  const addresses = [];
  for (let i = 0; i < count; i++) {
    const keypair = Keypair.generate();
    addresses.push(keypair.publicKey.toString());
  }
  return addresses;
}

async function getKeypairFromSeed(seedPhrase) {
  const seed = await bip39.mnemonicToSeed(seedPhrase);
  const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
  return Keypair.fromSeed(derivedSeed.slice(0, 32));
}

function getKeypairFromPrivateKey(privateKey) {
  const decoded = bs58.decode(privateKey);
  return Keypair.fromSecretKey(decoded);
}

function parseEnvArray(envVar) {
  if (!envVar) {
    return [];
  }
  try {
    return JSON.parse(envVar);
  } catch (e) {
    console.error('Failed to parse environment variable:', envVar, e);
    return [];
  }
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  const seedPhrases = parseEnvArray(process.env.SEED_PHRASES);
  const privateKeys = parseEnvArray(process.env.PRIVATE_KEYS);
  const keypairs = [];
  for (const seedPhrase of seedPhrases) {
    keypairs.push(await getKeypairFromSeed(seedPhrase));
  }
  for (const privateKey of privateKeys) {
    keypairs.push(getKeypairFromPrivateKey(privateKey));
  }
  if (keypairs.length === 0) {
    throw new Error('No valid SEED_PHRASES or PRIVATE_KEYS found in the .env file');
  }
  const randomAddresses = generateRandomAddresses(130);
  const amountToSend = 0.001;
  const delayBetweenRequests = 1000;
  for (let i = 0; i < keypairs.length; i++) {
    console.log(`====================[Wallet ${i + 1}]====================`);
    await sendMessageToTelegram(`====================[Wallet ${i + 1}]====================`);
    for (const [index, address] of randomAddresses.entries()) {
      const toPublicKey = new PublicKey(address);
      try {
        await sendSol(keypairs[i], toPublicKey, amountToSend);
        console.log(`[${index + 1}] Success send ${amountToSend} SOL to ${address}`);
        await sendMessageToTelegram(`[${index + 1}] Success send ${amountToSend} SOL to ${address}`);
      } catch (error) {
        console.error(`[${index + 1}] Failed to send SOL to ${address}:`, error);
        await sendMessageToTelegram(`[${index + 1}] Failed to send SOL to ${address}: ${error.message}`);
      }
      await delay(delayBetweenRequests);
    }
  }
  console.log('Waiting 24 hrs for next claim.');
  await delay(24 * 60 * 60 * 1000);
})();
