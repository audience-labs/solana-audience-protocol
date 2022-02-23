import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Flobrij } from '../target/types/flobrij';
import * as assert from 'assert';
import * as bs58 from "bs58";

describe('flobrij', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Flobrij as Program<Flobrij>;

  const EMAIL = 'akarys92@gmail.com';
  const TEST_AMOUNT = 5000; 
  const EXP_HOURS = 8760; 
  const FAKE_RECIPIENT = anchor.web3.Keypair.generate(); 

  it('Create a receipt!', async () => {
    const receipt = anchor.web3.Keypair.generate(); 
    const fakeTransaction = anchor.web3.Keypair.generate(); 
    // Add your test here.
    /*
      transaction: Pubkey, 
      recipient: Pubkey, 
      email: String, 
      amount: u32, 
      expiration_hours: u16
    */
    const tx = await program.rpc.createReceipt(fakeTransaction.publicKey, FAKE_RECIPIENT.publicKey, EMAIL, 5000, EXP_HOURS, {
        accounts: {
          // Accounts here...
          receipt: receipt.publicKey, 
          payer: program.provider.wallet.publicKey, 
          systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [
          // Key pairs of signers here...
          receipt
      ],
    });
    console.log("Your transaction signature", tx);
    const receiptAccount = await program.account.receipt.fetch(receipt.publicKey); 
    console.log(receiptAccount);
  });

  it('Create a receipt as a different user!', async () => {
    const receipt = anchor.web3.Keypair.generate(); 
    const fakeRecipient = anchor.web3.Keypair.generate(); 
    const fakeTransaction = anchor.web3.Keypair.generate(); 
    const fakeUser = anchor.web3.Keypair.generate(); 
    const signature = await program.provider.connection.requestAirdrop(fakeUser.publicKey, 1000000000);
    await program.provider.connection.confirmTransaction(signature);
    // Add your test here.
    /*
      transaction: Pubkey, 
      recipient: Pubkey, 
      email: String, 
      amount: u32, 
      expiration_hours: u16
    */
    const tx = await program.rpc.createReceipt(fakeTransaction.publicKey, fakeRecipient.publicKey, EMAIL, 5000, EXP_HOURS, {
        accounts: {
          // Accounts here...
          receipt: receipt.publicKey, 
          payer: fakeUser.publicKey, 
          systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [
          // Key pairs of signers here...
          receipt,
          fakeUser
      ],
    });
    console.log("Your transaction signature", tx);
    const receiptAccount = await program.account.receipt.fetch(receipt.publicKey); 
    console.log(receiptAccount);
  });

  it('Query for receipts by payee', async() => {
    const recipientPublicKey = FAKE_RECIPIENT.publicKey; 
    const receiptAccounts = await program.account.receipt.all([
      {
        memcmp: {
          offset: 8
            + 32, // Transaction key, 
          bytes: recipientPublicKey.toBase58(),
        }
      }
    ]);

    assert.equal(receiptAccounts.length, 1); 
    assert.ok(receiptAccounts.every(recipientAccounts =>{
      return recipientAccounts.account.recipient.toBase58() === recipientPublicKey.toBase58();
    })); 

  });

  it('Send and retrieve to me', async() => { 
    const receipt = anchor.web3.Keypair.generate(); 
    const fakeRecipient = "EjVxdTp7NXqUtqSACXeMojnTUwkFhr1wd5rxmDSLrstd";

    const fakeTransaction = anchor.web3.Keypair.generate(); 
    const fakeUser = anchor.web3.Keypair.generate(); 
    const signature = await program.provider.connection.requestAirdrop(fakeUser.publicKey, 1000000000);
    await program.provider.connection.confirmTransaction(signature);
    
    const tx = await program.rpc.createReceipt(fakeTransaction.publicKey, fakeRecipient, EMAIL, 5000, EXP_HOURS, {
        accounts: {
          // Accounts here...
          receipt: receipt.publicKey, 
          payer: fakeUser.publicKey, 
          systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [
          // Key pairs of signers here...
          receipt,
          fakeUser
      ],
    });
    console.log("Your transaction signature", tx);
    const receiptAccount = await program.account.receipt.fetch(receipt.publicKey); 
    console.log(receiptAccount);

    const receiptAccounts = await program.account.receipt.all([
      {
        memcmp: {
          offset: 8
            + 32, // Transaction key, 
          bytes: fakeRecipient,
        }
      }
    ]);
    console.log("\n\n This is the account that's interesting: ");
    console.log(receiptAccounts);
    assert.ok(receiptAccounts.every(recipientAccounts =>{
      return recipientAccounts.account.recipient.toBase58() === fakeRecipient;
    })); 

  });
});
