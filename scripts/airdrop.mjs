// Code based on deploy.js
//   available at https://github.com/DougAnderson444/solblog/blob/master/deploy.js
//   More info: https://github.com/DougAnderson444/solblog#deploy-to-devnet
//
// Changes:
// - Split out "airdrop" into separate script (github.com/briangershon)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';

const SLASH = path.sep;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const programAuthorityKeyfileName = `../deploy/programauthority-keypair.json`;
const programAuthorityKeypairFile = path.resolve(
  `${__dirname}${SLASH}${programAuthorityKeyfileName}`
);

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

const key = await readKeyfile(programAuthorityKeypairFile);
const publicKey = key.publicKey;

console.log({ publicKey });

console.log('\n\nRequesting airdrop for', publicKey.toString());
let signature = await connection.requestAirdrop(
  publicKey,
  LAMPORTS_PER_SOL * 2
);

await connection.confirmTransaction(signature);
console.log(
  `Balance for ${publicKey} is ${
    (await connection.getBalance(publicKey)) / LAMPORTS_PER_SOL
  } SOL`
);

function readKeyfile(keypairfile) {
  let kf = fs.readFileSync(keypairfile);
  let parsed = JSON.parse(kf.toString()); // [1,1,2,2,3,4]
  kf = new Uint8Array(parsed);
  const keypair = Keypair.fromSecretKey(kf);
  return keypair;
}
