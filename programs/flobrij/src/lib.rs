use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;


declare_id!("6nLbF7aMUH9GYsBFkW3uRA117p122rgN5P6UVwiBi9ve");

#[program]
pub mod flobrij {
    use super::*;
    pub fn create_receipt(ctx: Context<CreateReceipt>, 
        transaction: Pubkey, 
        recipient: Pubkey, 
        email: String, 
        amount: u32, 
        expiration_hours: u16
    ) -> ProgramResult {
        /*
        * TODO: 
        *  - We should look up the transaction and pull it's information instead of just taking it from the call. Figure this out later.
        */ 
        let receipt: &mut Account<Receipt> = &mut ctx.accounts.receipt; 
        let payer: &Signer = &ctx.accounts.payer; 
        let clock: Clock = Clock::get().unwrap();

        receipt.payer = *payer.key; 
        receipt.timestamp = clock.unix_timestamp; 

        // TODO: Get transaction information, make sure it's a valid transaction
        //      - Make sure the payer and the recipient match the transaction as well as the amount

        if email.chars().count() > 254 {
            return Err(ErrorCode::EmailTooLong.into())
        }

        receipt.transaction = transaction; 
        receipt.recipient = recipient; 
        receipt.email = email; 
        receipt.amount = amount; 
        receipt.expiration_hours = expiration_hours; 

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateReceipt<'info> {
    #[account(init, payer = payer, space = Receipt::LEN)]
    pub receipt: Account<'info, Receipt>, 
    #[account(mut)]
    pub payer: Signer<'info>, 
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>
}

#[account]
pub struct Receipt {
    pub payer: Pubkey, 
    pub recipient: Pubkey, 
    pub timestamp: i64, 
    pub expiration_hours: u16, 
    pub email: String, 
    pub amount: u32, 
    pub transaction: Pubkey, 
}

// Sizing consts
const DISCRIMINATOR_LENGTH: usize = 8;
const PAYER_PUBLIC_KEY_LENGTH: usize = 32;
const RECIPIENT_PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const EXPIRATION_HOURS_LENGTH: usize = 2;
// Email is max 254 characters
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_EMAIL_LENGTH: usize = 254 * 4; // 254 chars max.
const AMOUNT_LENGTH: usize = 4; 
const TRANSACTION_PUBLIC_KEY_LENGTH: usize = 32;

impl Receipt {
    const LEN: usize = DISCRIMINATOR_LENGTH
    + PAYER_PUBLIC_KEY_LENGTH
    + RECIPIENT_PUBLIC_KEY_LENGTH
    + TIMESTAMP_LENGTH
    + EXPIRATION_HOURS_LENGTH
    + STRING_LENGTH_PREFIX + MAX_EMAIL_LENGTH
    + AMOUNT_LENGTH
    + TRANSACTION_PUBLIC_KEY_LENGTH; 
}

#[error]
pub enum ErrorCode {
    #[msg("The provided email should be 254 characters long maximum.")]
    EmailTooLong,
}