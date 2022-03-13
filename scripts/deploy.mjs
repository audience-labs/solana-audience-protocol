// Code based on deploy.js
//   available at https://github.com/DougAnderson444/solblog/blob/master/deploy.js
//   More info: https://github.com/DougAnderson444/solblog#deploy-to-devnet
//
// Changes:
// - Split out "deploy" into separate script (github.com/briangershon)
// - Manually decide to deploy or ugprade via command line (github.com/briangershon)

import fs from 'fs';
import spawn from 'cross-spawn';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Keypair, Connection } from '@solana/web3.js';

const args = process.argv.slice(2);
if (args.length != 1) {
  console.log('Error: You must pass in either "deploy" or "upgrade.');
  process.exit(1);
}
const [command] = args;

const projectName = 'flobrij';
const network = 'devnet';

const SLASH = path.sep;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const programAuthorityKeyfileName = `../deploy/programauthority-keypair.json`;
const programAuthorityKeypairFile = path.resolve(
  `${__dirname}${SLASH}${programAuthorityKeyfileName}`
);

const programKeyfileName = `../target/deploy/${projectName}-keypair.json`;
const programKeypairFile = path.resolve(
  `${__dirname}${SLASH}${programKeyfileName}`
);

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

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
    process.exit(1);
  }

  programAuthorityKeypair = readKeyfile(programAuthorityKeypairFile);
  spawn.sync('anchor', ['build'], { stdio: 'inherit' });

  if (command === 'deploy') {
    // NEW DEPLOY PATH
    console.log(`\n\n\⚙️  Deploying program...\n`);
    method = ['deploy'];
  } else if (command == 'upgrade') {
    // UPGRADE PATH
    console.log(`\n\n\⚙️  Upgrading program...\n`);
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
