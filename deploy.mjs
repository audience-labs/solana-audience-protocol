// Code based on deploy.js
//   available at https://github.com/DougAnderson444/solblog/blob/master/deploy.js
//   More info: https://github.com/DougAnderson444/solblog#deploy-to-devnet

import fs from 'fs';

import spawn from 'cross-spawn';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';

const projectName = 'flobrij';
const network = 'devnet'; // "devnet". Use "localnet" for testing.

const SLASH = path.sep;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const programAuthorityKeyfileName = `deploy/programauthority-keypair.json`;
const programAuthorityKeypairFile = path.resolve(
  `${__dirname}${SLASH}${programAuthorityKeyfileName}`
);

const programKeyfileName = `target/deploy/${projectName}-keypair.json`;
const programKeypairFile = path.resolve(
  `${__dirname}${SLASH}${programKeyfileName}`
);

let connection;
if (network === 'Localnet') {
  connection = new Connection('http://localhost:8899', 'confirmed');
} else {
  connection = new Connection('https://api.devnet.solana.com', 'confirmed');
}

function readKeyfile(keypairfile) {
  let kf = fs.readFileSync(keypairfile);
  let parsed = JSON.parse(kf.toString()); // [1,1,2,2,3,4]
  kf = new Uint8Array(parsed);
  const keypair = Keypair.fromSecretKey(kf);
  return keypair;
}

(async () => {
  let method;
  let programAuthorityKeypair;
  let programId;
  let programKeypair;

  programKeypair = readKeyfile(programKeypairFile);
  programId = programKeypair.publicKey.toString();

  if (!fs.existsSync(programAuthorityKeypairFile)) {
    // doesnt exist create it
    // use this to deploy

    spawn.sync('anchor', ['build'], { stdio: 'inherit' });

    programAuthorityKeypair = new Keypair();
    console.log(
      '\n\nRequesting airdrop for',
      programAuthorityKeypair.publicKey.toString()
    );
    let signature = await connection.requestAirdrop(
      programAuthorityKeypair.publicKey,
      LAMPORTS_PER_SOL * 5
    );
    const result = await connection.confirmTransaction(signature);
    console.log('\n\nBALANCE', await connection.getBalance(programAuthorityKeypair.publicKey));

    console.log(`\n\n\⚙️ Created keypair.\n`);
    console.log(`\n\n\⚙️ Saving keypair. ${programAuthorityKeypairFile}\n`);

    fs.writeFileSync(
      programAuthorityKeypairFile,
      `[${Buffer.from(programAuthorityKeypair.secretKey.toString())}]`
    );

    method = ['deploy'];
  } else {
    // does exist, use it to upgrade

    programAuthorityKeypair = readKeyfile(programAuthorityKeypairFile);

    console.log(`\n\n\⚙️ Upgrading program.\n`);

    method = [
      'upgrade',
      `target/deploy/${projectName}.so`,
      '--program-id',
      programId,
    ];
  }

  console.log([
    ...method,
    '--provider.cluster',
    `${network}`,
    '--provider.wallet',
    `${programAuthorityKeypairFile}`,
  ]);

  spawn.sync(
    'anchor',
    [
      ...method,
      '--provider.cluster',
      `${network}`,
      '--provider.wallet',
      `${programAuthorityKeypairFile}`,
    ],
    { stdio: 'inherit' }
  );

  fs.copyFile(
    `target/idl/${projectName}.json`,
    `../flobrij-frontend/src/idl.json`,
    (err) => {
      if (err) throw err;
      console.log(
        `${projectName}.json was copied to front-end. MAKE SURE YOU CHECK-IN THIS FILE ON FRONT-END AND DEPLOY THAT`
      );
    }
  );
})();
