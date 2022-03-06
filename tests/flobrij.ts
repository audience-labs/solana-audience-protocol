import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Flobrij } from '../target/types/flobrij';
import * as assert from 'assert';

describe('flobrij', () => {
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Flobrij as Program<Flobrij>;

  const EMAIL = 'test@test.com';
  const TEST_AMOUNT = new anchor.BN(5000);
  const EXP_HOURS = 8760;
  const TEST_RECIPIENT = anchor.web3.Keypair.generate();
  const AIRDROP_AMOUNT = 1000000000;

  it('should pay creator and create a receipt for patron', async () => {
    // create new wallet for Creator
    const newProvider = new anchor.Provider(
      anchor.getProvider().connection,
      new anchor.Wallet(TEST_RECIPIENT),
      {}
    );

    // add some SOL
    const signature = await newProvider.connection.requestAirdrop(
      newProvider.wallet.publicKey,
      AIRDROP_AMOUNT
    );
    await newProvider.connection.confirmTransaction(signature);

    const creatorBalanceInitially = await newProvider.connection.getBalance(
      newProvider.wallet.publicKey
    );

    const receipt = anchor.web3.Keypair.generate();

    const tx = await program.rpc.createReceipt(EMAIL, TEST_AMOUNT, EXP_HOURS, {
      accounts: {
        receipt: receipt.publicKey,
        payer: program.provider.wallet.publicKey,
        recipient: newProvider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [receipt],
    });

    const receiptAccount = await program.account.receipt.fetch(
      receipt.publicKey
    );

    const creatorBalanceAfterPayment = await newProvider.connection.getBalance(
      newProvider.wallet.publicKey
    );

    assert.ok(
      new anchor.BN(creatorBalanceInitially).eq(
        new anchor.BN(creatorBalanceAfterPayment).sub(TEST_AMOUNT)
      ),
      'Creator received their crypto'
    );

    assert.equal(receiptAccount.email, EMAIL);
    assert.ok(new anchor.BN(receiptAccount.amount).eq(TEST_AMOUNT));
    assert.equal(receiptAccount.expirationHours, EXP_HOURS);
    assert.equal(
      receiptAccount.recipient,
      newProvider.wallet.publicKey.toString()
    );
  });

  it('Create a receipt as a different user', async () => {
    const receipt = anchor.web3.Keypair.generate();
    const fakeRecipient = anchor.web3.Keypair.generate();
    const fakeUser = anchor.web3.Keypair.generate();
    const signature = await program.provider.connection.requestAirdrop(
      fakeUser.publicKey,
      AIRDROP_AMOUNT
    );
    await program.provider.connection.confirmTransaction(signature);

    const tx = await program.rpc.createReceipt(EMAIL, TEST_AMOUNT, EXP_HOURS, {
      accounts: {
        receipt: receipt.publicKey,
        payer: fakeUser.publicKey,
        recipient: fakeUser.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [receipt, fakeUser],
    });
    const receiptAccount = await program.account.receipt.fetch(
      receipt.publicKey
    );

    assert.equal(receiptAccount.email, EMAIL);
    assert.ok(new anchor.BN(receiptAccount.amount).eq(TEST_AMOUNT));
    assert.equal(receiptAccount.expirationHours, EXP_HOURS);
    assert.equal(receiptAccount.recipient, fakeUser.publicKey.toString());
  });

  it('Query for receipts by payee', async () => {
    const recipientPublicKey = TEST_RECIPIENT.publicKey;
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

    const fakeUser = anchor.web3.Keypair.generate();
    const signature = await program.provider.connection.requestAirdrop(
      fakeUser.publicKey,
      AIRDROP_AMOUNT
    );
    await program.provider.connection.confirmTransaction(signature);

    const tx = await program.rpc.createReceipt(EMAIL, TEST_AMOUNT, EXP_HOURS, {
      accounts: {
        receipt: receipt.publicKey,
        payer: fakeUser.publicKey,
        recipient: fakeUser.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [receipt, fakeUser],
    });

    const receiptAccount = await program.account.receipt.fetch(
      receipt.publicKey
    );

    const receiptAccounts = await program.account.receipt.all([
      {
        memcmp: {
          offset: 8 + 32, // Transaction key,
          bytes: fakeRecipient.toString(),
        },
      },
    ]);

    // This is the account that's interesting:
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
