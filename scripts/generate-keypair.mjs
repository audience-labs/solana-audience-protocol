// Code based on deploy.js
//   available at https://github.com/DougAnderson444/solblog/blob/master/deploy.js
//   More info: https://github.com/DougAnderson444/solblog#deploy-to-devnet
//
// Changes:
// - Split out "generate keypair" into separate script (github.com/briangershon)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Keypair } from '@solana/web3.js';

const SLASH = path.sep;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const programAuthorityKeyfileName = `../deploy/programauthority-keypair.json`;
const programAuthorityKeypairFile = path.resolve(
  `${__dirname}${SLASH}${programAuthorityKeyfileName}`
);

if (!fs.existsSync(programAuthorityKeypairFile)) {
  console.log(`\n\n\⚙️  Created keypair.\n`);
  const programAuthorityKeypair = new Keypair();
  console.log(`\n\n\⚙️  Saving keypair. ${programAuthorityKeypairFile}\n`);

  fs.writeFileSync(
    programAuthorityKeypairFile,
    `[${Buffer.from(programAuthorityKeypair.secretKey.toString())}]`
  );
} else {
  console.log(
    `Keypair already exists at ${programAuthorityKeyfileName}. No action taken.`
  );
}
