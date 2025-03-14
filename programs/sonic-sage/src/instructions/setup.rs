use std::str::FromStr;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{pubkey, pubkey::Pubkey};
use anchor_spl::token::{Mint, TokenAccount, InitializeAccount, Token};
use crate::state::metadata::Metadata;

// const USDC_MINT: Pubkey = pubkey!("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

#[derive(Accounts)]
// #[instruction(mint_addr: String)]
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

    // #[account(address = Pubkey::from_str(&mint_addr).unwrap())]
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn setup_metadata(ctx: Context<Setup>) -> Result<()> {
    msg!("Mint address: {:?}", ctx.accounts.mint.key());
    ctx.accounts.metadata.market_counter = 0;
    Ok(())
}