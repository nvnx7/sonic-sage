use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_spl::token::{Mint, TokenAccount, Token};
use crate::state::metadata::Metadata;

/// Context accounts for setting up the program
#[derive(Accounts)]
pub struct Setup<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 8,
        seeds = [b"metadata"],
        bump
    )]
    pub metadata: Account<'info, Metadata>,

    #[account(
        init,
        payer = signer,
        token::mint = mint,
        token::authority = token_account,
        seeds = [b"token"],
        bump
    )]
    pub token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Initializes the program metadata
/// 
/// # Arguments
/// 
/// * `ctx` - Setup context containing required accounts
pub fn setup_metadata(ctx: Context<Setup>) -> Result<()> {
    ctx.accounts.metadata.market_counter = 0;
    Ok(())
}