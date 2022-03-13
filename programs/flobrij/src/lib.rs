use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;
use anchor_lang::solana_program::system_program;

declare_id!("GbZsjFDK2PAgZausAKxhBNdZjoUgLy6sVvb92ohGr2je");

#[program]
pub mod flobrij {
    use super::*;
    pub fn create_receipt(
        ctx: Context<CreateReceipt>,
        email: String,
        expiration_hours: u16,
        // supportlevel: Pubkey,
    ) -> ProgramResult {
        let receipt: &mut Account<Receipt> = &mut ctx.accounts.receipt;
        let supportlevel: &mut Account<SupportLevel> = &mut ctx.accounts.supportlevel;
        let payer: &Signer = &ctx.accounts.payer;
        let clock: Clock = Clock::get().unwrap();

        receipt.payer = *payer.key;
        receipt.timestamp = clock.unix_timestamp;

        if email.chars().count() > 254 {
            return Err(ErrorCode::EmailTooLong.into());
        }

        // TODO: Ensure there is a supportlevel choosen

        let amount = supportlevel.price;

        // first Patron should pay Recipient ("Creator")
        let ix = system_instruction::transfer(
            &ctx.accounts.payer.key(),
            &ctx.accounts.recipient.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.recipient.to_account_info(),
            ],
        )
        .unwrap();

        receipt.recipient = ctx.accounts.recipient.key();
        receipt.supportlevel = ctx.accounts.supportlevel.key();
        receipt.email = email;
        receipt.amount = amount;
        receipt.expiration_hours = expiration_hours;

        Ok(())
    }

    pub fn create_supportlevel(
        ctx: Context<CreateSupportLevel>,
        title: String,
        price: u64,
        description: String,
        benefit: String,
    ) -> ProgramResult {
        let supportlevel: &mut Account<SupportLevel> = &mut ctx.accounts.supportlevel;
        let payer: &Signer = &ctx.accounts.payer;

        supportlevel.payer = *payer.key;

        if title.chars().count() > 50 {
            return Err(ErrorCode::TitleTooLong.into());
        }

        if description.chars().count() > 254 {
            return Err(ErrorCode::DescriptionTooLong.into());
        }

        if benefit.chars().count() > 100 {
            return Err(ErrorCode::BenefitTooLong.into());
        }

        supportlevel.title = title;
        supportlevel.price = price;
        supportlevel.description = description;
        supportlevel.benefit = benefit;

        Ok(())
    }

    pub fn set_supportlevel(
        ctx: Context<SetSupportLevel>,
        title: String,
        price: u64,
        description: String,
        benefit: String,
    ) -> ProgramResult {
        let supportlevel: &mut Account<SupportLevel> = &mut ctx.accounts.supportlevel;

        if title.chars().count() > 50 {
            return Err(ErrorCode::TitleTooLong.into());
        }

        if description.chars().count() > 254 {
            return Err(ErrorCode::DescriptionTooLong.into());
        }

        if benefit.chars().count() > 100 {
            return Err(ErrorCode::BenefitTooLong.into());
        }

        supportlevel.title = title;
        supportlevel.price = price;
        supportlevel.description = description;
        supportlevel.benefit = benefit;

        Ok(())
    }

    pub fn delete_supportlevel(_ctx: Context<DeleteSupportLevel>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateReceipt<'info> {
    #[account(init, payer = payer, space = Receipt::LEN)]
    pub receipt: Account<'info, Receipt>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    #[account(mut)]
    pub supportlevel: Account<'info, SupportLevel>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
}

#[account]
pub struct Receipt {
    pub payer: Pubkey,
    pub recipient: Pubkey,
    pub supportlevel: Pubkey,
    pub timestamp: i64,
    pub expiration_hours: u16,
    pub email: String,
    pub amount: u64,
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
const AMOUNT_LENGTH: usize = 8;

impl Receipt {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PAYER_PUBLIC_KEY_LENGTH
        + RECIPIENT_PUBLIC_KEY_LENGTH
        + TIMESTAMP_LENGTH
        + EXPIRATION_HOURS_LENGTH
        + STRING_LENGTH_PREFIX
        + MAX_EMAIL_LENGTH
        + AMOUNT_LENGTH;
}

//
// SUPPORT LEVEL
//

#[derive(Accounts)]
pub struct CreateSupportLevel<'info> {
    #[account(init, payer = payer, space = SupportLevel::LEN)]
    pub supportlevel: Account<'info, SupportLevel>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct SetSupportLevel<'info> {
    #[account(mut)]
    pub supportlevel: Account<'info, SupportLevel>,
    #[account(mut)]
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeleteSupportLevel<'info> {
    #[account(mut, close = sol_dest)]
    pub supportlevel: Account<'info, SupportLevel>,
    sol_dest: AccountInfo<'info>,
}

#[account]
pub struct SupportLevel {
    pub payer: Pubkey,
    pub title: String,
    pub price: u64,
    pub description: String,
    pub benefit: String,
    // pub expiration_hours: u16,
}

const MAX_SUPPORTLEVEL_PAYER_PUBLIC_KEY_LENGTH: usize = 32;
const MAX_SUPPORTLEVEL_PRICE_LENGTH: usize = 8;
const MAX_SUPPORTLEVEL_TITLE_LENGTH: usize = 50 * 4; // 50 chars max.
const MAX_SUPPORTLEVEL_DESCRIPTION_LENGTH: usize = 254 * 4; // 254 chars max.
const MAX_SUPPORTLEVEL_BENEFIT_LENGTH: usize = 100 * 4; // 100 chars max.

impl SupportLevel {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + MAX_SUPPORTLEVEL_PAYER_PUBLIC_KEY_LENGTH
        + STRING_LENGTH_PREFIX
        + MAX_SUPPORTLEVEL_TITLE_LENGTH
        + MAX_SUPPORTLEVEL_PRICE_LENGTH
        + STRING_LENGTH_PREFIX
        + MAX_SUPPORTLEVEL_DESCRIPTION_LENGTH
        + STRING_LENGTH_PREFIX
        + MAX_SUPPORTLEVEL_BENEFIT_LENGTH;
}

//
// Error message
//

#[error]
pub enum ErrorCode {
    #[msg("The provided email should be 254 characters long maximum.")]
    EmailTooLong,
    #[msg("The provided title should be 50 characters long maximum.")]
    TitleTooLong,
    #[msg("The provided description should be 254 characters long maximum.")]
    DescriptionTooLong,
    #[msg("The provided benefit should be 100 characters long maximum.")]
    BenefitTooLong,
}
