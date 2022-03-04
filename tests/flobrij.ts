import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Flobrij } from '../target/types/flobrij';
import * as assert from 'assert';

describe('flobrij', () => {
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Flobrij as Program<Flobrij>;

  const EMAIL = 'test@test.com';
  const TEST_AMOUNT = 5000;
  const EXP_HOURS = 8760;
  const TEST_CREATOR = anchor.web3.Keypair.generate();
  const AIRDROP_AMOUNT = 1000000000;

  it('Create a receipt', async () => {
    const receipt = anchor.web3.Keypair.generate();
    const fakeTransaction = anchor.web3.Keypair.generate();
    /*
      transaction: Pubkey, 
      recipient: Pubkey, 
      email: String, 
      amount: u32, 
      expiration_hours: u16
    */
    const tx = await program.rpc.createReceipt(
      fakeTransaction.publicKey,
      TEST_CREATOR.publicKey,
      EMAIL,
      TEST_AMOUNT,
      EXP_HOURS,
      {
        accounts: {
          // Accounts here...
          receipt: receipt.publicKey,
          payer: program.provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [
          // Key pairs of signers here...
          receipt,
        ],
      }
    );

    const receiptAccount = await program.account.receipt.fetch(
      receipt.publicKey
    );

    console.log(receiptAccount);

    // assert.equal(program.provider.wallet.publicKey.toString(), TEST_CREATOR.secretKey.toString());

    assert.equal(receiptAccount.email, EMAIL);
    assert.equal(receiptAccount.amount, TEST_AMOUNT);
    assert.equal(receiptAccount.expirationHours, EXP_HOURS);
  });

  it('Create a receipt as a different user', async () => {
    const receipt = anchor.web3.Keypair.generate();
    const fakeRecipient = anchor.web3.Keypair.generate();
    const fakeTransaction = anchor.web3.Keypair.generate();
    const fakeUser = anchor.web3.Keypair.generate();
    const signature = await program.provider.connection.requestAirdrop(
      fakeUser.publicKey,
      AIRDROP_AMOUNT
    );
    await program.provider.connection.confirmTransaction(signature);
    /*
      transaction: Pubkey,
      recipient: Pubkey,
      email: String,
      amount: u32,
      expiration_hours: u16
    */
    const tx = await program.rpc.createReceipt(
      fakeTransaction.publicKey,
      fakeRecipient.publicKey,
      EMAIL,
      TEST_AMOUNT,
      EXP_HOURS,
      {
        accounts: {
          // Accounts here...
          receipt: receipt.publicKey,
          payer: fakeUser.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [
          // Key pairs of signers here...
          receipt,
          fakeUser,
        ],
      }
    );
    const receiptAccount = await program.account.receipt.fetch(
      receipt.publicKey
    );
    console.log(receiptAccount);
  });

  it('Query for receipts by payee', async () => {
    const recipientPublicKey = TEST_CREATOR.publicKey;
    const receiptAccounts = await program.account.receipt.all([
      {
        memcmp: {
          offset: 8 + 32, // Transaction key,
          bytes: recipientPublicKey.toBase58(),
        },
      },
    ]);

    assert.equal(receiptAccounts.length, 1);
    assert.ok(
      receiptAccounts.every((recipientAccounts) => {
        return (
          recipientAccounts.account.recipient.toBase58() ===
          recipientPublicKey.toBase58()
        );
      })
    );
  });

  it('Send and retrieve to me', async () => {
    const receipt = anchor.web3.Keypair.generate();
    const fakeRecipient = new anchor.web3.PublicKey(
      'EjVxdTp7NXqUtqSACXeMojnTUwkFhr1wd5rxmDSLrstd'
    );

    const fakeTransaction = anchor.web3.Keypair.generate();
    const fakeUser = anchor.web3.Keypair.generate();
    const signature = await program.provider.connection.requestAirdrop(
      fakeUser.publicKey,
      AIRDROP_AMOUNT
    );
    await program.provider.connection.confirmTransaction(signature);

    const tx = await program.rpc.createReceipt(
      fakeTransaction.publicKey,
      fakeRecipient,
      EMAIL,
      TEST_AMOUNT,
      EXP_HOURS,
      {
        accounts: {
          // Accounts here...
          receipt: receipt.publicKey,
          payer: fakeUser.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [
          // Key pairs of signers here...
          receipt,
          fakeUser,
        ],
      }
    );
    console.log('Your transaction signature', tx);
    const receiptAccount = await program.account.receipt.fetch(
      receipt.publicKey
    );
    console.log(receiptAccount);

    const receiptAccounts = await program.account.receipt.all([
      {
        memcmp: {
          offset: 8 + 32, // Transaction key,
          bytes: fakeRecipient.toString(),
        },
      },
    ]);
    console.log("\n\n This is the account that's interesting: ");
    console.log(receiptAccounts);
    assert.ok(
      receiptAccounts.every((recipientAccounts) => {
        return (
          recipientAccounts.account.recipient.toBase58() ===
          fakeRecipient.toBase58()
        );
      })
    );
  });
});
