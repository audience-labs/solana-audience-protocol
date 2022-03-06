import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Flobrij } from '../target/types/flobrij';
import * as assert from 'assert';

describe('SupportLevel', () => {
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Flobrij as Program<Flobrij>;

  const TEST_TITLE = 'Demigods';
  const TEST_MONTHLY_PRICE = new anchor.BN(5000);
  const TEST_DESCRIPTION = 'Join the monthly Demigods newsletter';
  const TEST_BENEFIT = 'Access to all our articles';

  it('created successfully', async function () {
    const supportlevel = anchor.web3.Keypair.generate();

    const tx = await program.rpc.createSupportlevel(
      TEST_TITLE,
      TEST_MONTHLY_PRICE,
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

    const account = await program.account.supportLevel.fetch(
      supportlevel.publicKey
    );

    assert.equal(account.title, 'Demigods');
    assert.ok(account.monthlyPrice.eq(new anchor.BN(5000)));
    assert.equal(account.description, 'Join the monthly Demigods newsletter');
    assert.equal(account.benefit, 'Access to all our articles');
    assert.equal(account.payer, program.provider.wallet.publicKey.toString());
  });
});
