import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Flobrij } from '../target/types/flobrij';
import * as assert from 'assert';

const DISCRIMINATOR_LENGTH = 8;

describe('SupportLevel', () => {
  anchor.setProvider(anchor.Provider.env());
  const program = anchor.workspace.Flobrij as Program<Flobrij>;

  const TEST_TITLE = 'Demigods';
  const TEST_PRICE = new anchor.BN(5000);
  const TEST_DESCRIPTION = 'Join the monthly Demigods newsletter';
  const TEST_BENEFIT = 'Access to all our articles';

  describe('as Creator', function () {
    let supportlevel;

    beforeEach(async function () {
      supportlevel = anchor.web3.Keypair.generate();

      await program.rpc.createSupportlevel(
        TEST_TITLE,
        TEST_PRICE,
        TEST_DESCRIPTION,
        TEST_BENEFIT,
        {
          accounts: {
            supportlevel: supportlevel.publicKey,
            payer: program.provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          },
          signers: [supportlevel],
        }
      );
    });

    afterEach(async function () {
      await program.rpc.deleteSupportlevel({
        accounts: {
          supportlevel: supportlevel.publicKey,
          solDest: program.provider.wallet.publicKey,
        },
        signers: [],
      });
    });

    it('can create a new support level', async function () {
      const account = await program.account.supportLevel.fetch(
        supportlevel.publicKey
      );

      assert.equal(account.title, 'Demigods');
      assert.ok(account.price.eq(new anchor.BN(5000)));
      assert.equal(account.description, 'Join the monthly Demigods newsletter');
      assert.equal(account.benefit, 'Access to all our articles');
      assert.equal(account.payer, program.provider.wallet.publicKey.toString());
    });

    it('can edit my support level', async function () {
      await program.rpc.setSupportlevel(
        TEST_TITLE + ' edited',
        TEST_PRICE,
        TEST_DESCRIPTION,
        TEST_BENEFIT,
        {
          accounts: {
            supportlevel: supportlevel.publicKey,
            payer: program.provider.wallet.publicKey,
          },
          signers: [],
        }
      );

      const account = await program.account.supportLevel.fetch(
        supportlevel.publicKey
      );

      assert.equal(account.title, 'Demigods edited');
    });

    it('no one else should be able to edit', async function () {
      const anotherUser = anchor.web3.Keypair.generate();
      await assert.rejects(async function () {
        await program.rpc.setSupportlevel(
          TEST_TITLE + ' edited by someone else',
          TEST_PRICE,
          TEST_DESCRIPTION,
          TEST_BENEFIT,
          {
            accounts: {
              supportlevel: supportlevel.publicKey,
              payer: anotherUser.publicKey,
            },
            signers: [],
          }
        );
      });
    });

    it('can delete my support level', async function () {
      const level = anchor.web3.Keypair.generate();

      await program.rpc.createSupportlevel(
        TEST_TITLE,
        TEST_PRICE,
        TEST_DESCRIPTION,
        TEST_BENEFIT,
        {
          accounts: {
            supportlevel: level.publicKey,
            payer: program.provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          },
          signers: [level],
        }
      );

      await program.rpc.deleteSupportlevel({
        accounts: {
          supportlevel: level.publicKey,
          solDest: program.provider.wallet.publicKey,
        },
        signers: [],
      });

      await assert.rejects(async function () {
        const account = await program.account.supportLevel.fetch(
          level.publicKey
        );
      });
    });

    it('can see list of all my support levels', async function () {
      // create a 2nd support level
      const supportlevel2 = anchor.web3.Keypair.generate();

      await program.rpc.createSupportlevel(
        TEST_TITLE + '2',
        TEST_PRICE,
        TEST_DESCRIPTION,
        TEST_BENEFIT,
        {
          accounts: {
            supportlevel: supportlevel2.publicKey,
            payer: program.provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          },
          signers: [supportlevel2],
        }
      );

      const account2 = await program.account.supportLevel.fetch(
        supportlevel2.publicKey
      );

      assert.equal(account2.title, 'Demigods2');

      // retrieve full list and filter by owner
      const creator = program.provider.wallet.publicKey.toString();

      const supportlevelAccounts = await program.account.supportLevel.all([
        {
          memcmp: {
            offset: DISCRIMINATOR_LENGTH, // payer public key
            bytes: creator,
          },
        },
      ]);
      // console.log('supportlevelAccounts', supportlevelAccounts);

      assert.equal(supportlevelAccounts.length, 2);

      await program.rpc.deleteSupportlevel({
        accounts: {
          supportlevel: supportlevel2.publicKey,
          solDest: program.provider.wallet.publicKey,
        },
        signers: [],
      });
    });

    it('sees an error if title too long', async function () {
      const supportlevel2 = anchor.web3.Keypair.generate();
      await assert.rejects(async function () {
        await program.rpc.createSupportlevel(
          'T'.repeat(51), // too long
          TEST_PRICE,
          TEST_DESCRIPTION,
          TEST_BENEFIT,
          {
            accounts: {
              supportlevel: supportlevel2.publicKey,
              payer: program.provider.wallet.publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [supportlevel2],
          }
        );
      });
    });

    it('sees an error if description too long', async function () {
      const supportlevel2 = anchor.web3.Keypair.generate();
      await assert.rejects(async function () {
        await program.rpc.createSupportlevel(
          TEST_TITLE,
          TEST_PRICE,
          'T'.repeat(255), // too long
          TEST_BENEFIT,
          {
            accounts: {
              supportlevel: supportlevel2.publicKey,
              payer: program.provider.wallet.publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [supportlevel2],
          }
        );
      });
    });

    it('sees an error if benefit too long', async function () {
      const supportlevel2 = anchor.web3.Keypair.generate();
      await assert.rejects(async function () {
        await program.rpc.createSupportlevel(
          TEST_TITLE,
          TEST_PRICE,
          TEST_DESCRIPTION,
          'T'.repeat(101), // too long
          {
            accounts: {
              supportlevel: supportlevel2.publicKey,
              payer: program.provider.wallet.publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [supportlevel2],
          }
        );
      });
    });
  });
});
