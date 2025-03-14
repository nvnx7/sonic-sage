use {
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::AssociatedToken,
        token::{transfer, Mint, Token, TokenAccount, Transfer},
    },
};

use crate::errors::*;
use crate::state::market::Market;
use crate::state::outcome::OutcomeAccount;

#[derive(Accounts)]
pub struct RedeemOutcome<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub subsidy_mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = subsidy_mint,
        token::authority = signer
    )]
    pub signer_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"token"],
        bump
    )]
    pub program_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + OutcomeAccount::INIT_SPACE,
        seeds = [b"outcome", market.key().as_ref(), signer.key().as_ref()],
        bump
    )]
    pub outcome_account: Account<'info, OutcomeAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn redeem_outcome(ctx: Context<RedeemOutcome>) -> Result<()> {
    require!(ctx.accounts.market.is_resolved, CustomError::MarketNotResolvedYet);

    // Calculate the winning outcome amount
    let winning_outcome = ctx.accounts.market.outcome.unwrap();
    let (num_outcomes, total_winning_outcome) = if winning_outcome == 0 { 
        (ctx.accounts.outcome_account.amount_0, ctx.accounts.market.num_outcome_0)
    } else { 
        (ctx.accounts.outcome_account.amount_1, ctx.accounts.market.num_outcome_1)
    };
    let subsidy_token_balance = 0u64;
    let win_amount = (num_outcomes * subsidy_token_balance) / total_winning_outcome;

    // Transfer the winning amount to the signer
    let signer_seeds: &[&[&[u8]]] = &[&[b"token", &[ctx.bumps.program_token_account]]];
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.program_token_account.to_account_info(),
        to: ctx.accounts.signer_token_account.to_account_info(),
        authority: ctx.accounts.program_token_account.to_account_info(),
    };
    transfer(CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds), win_amount)?;

    Ok(())
}