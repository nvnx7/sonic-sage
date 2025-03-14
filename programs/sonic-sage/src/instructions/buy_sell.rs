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
#[instruction(outcome:u8, amount: u64)]
pub struct BuySellOutcome<'info> {
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

pub fn buy_outcome(
    ctx: Context<BuySellOutcome>,
    outcome: u8,
    amount: u64
) -> Result<()> {
    require!(!ctx.accounts.market.is_resolved, CustomError::MarketAlreadyResolved);
    require!(outcome == 0 || outcome == 1, CustomError::InvalidOutcome);

    // Calculate the total price of outcome
    let price_per_outcome = if outcome == 0 {
        ctx.accounts.market.price_outcome_0
    } else {
        ctx.accounts.market.price_outcome_1
    };
    let total_price_outcome = (price_per_outcome * 10u64.pow(ctx.accounts.subsidy_mint.decimals as u32) as f64) as u64 * amount;
    
    // Transfer the amount of subsidy tokens to the program
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.signer_token_account.to_account_info(),
        to: ctx.accounts.program_token_account.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
    };
    transfer(CpiContext::new(cpi_program, cpi_accounts), total_price_outcome)?;

    // Deduct available outcome available to buy and add to user's outcome account
    if outcome == 0 {
        require!(ctx.accounts.market.num_outcome_0 > amount, CustomError::InsufficientOutcomeAvailable);
        ctx.accounts.market.num_outcome_0 -= amount;
        ctx.accounts.outcome_account.amount_0 += amount;
    } else {
        require!(ctx.accounts.market.num_outcome_1 > amount, CustomError::InsufficientOutcomeAvailable);
        ctx.accounts.market.num_outcome_1 -= amount;
        ctx.accounts.outcome_account.amount_1 += amount;
    }

    // Adjust prices according to LMSR formula
    let (price_0, price_1) = adjust_prices(&ctx);
    ctx.accounts.market.price_outcome_0 = price_0;
    ctx.accounts.market.price_outcome_1 = price_1;

    Ok(())
}

pub fn sell_outcome(
    ctx: Context<BuySellOutcome>,
    outcome: u8,
    amount: u64
) -> Result<()> {
    require!(!ctx.accounts.market.is_resolved, CustomError::MarketAlreadyResolved);
    require!(outcome == 0 || outcome == 1, CustomError::InvalidOutcome);
    
    // Calculate the total price of outcome
    let price_per_outcome = if outcome == 0 {
        ctx.accounts.market.price_outcome_0
    } else {
        ctx.accounts.market.price_outcome_1
    };
    let total_price_outcome = (price_per_outcome * 10u64.pow(ctx.accounts.subsidy_mint.decimals as u32) as f64) as u64 * amount;

    let signer_seeds: &[&[&[u8]]] = &[&[b"token", &[ctx.bumps.program_token_account]]];
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.program_token_account.to_account_info(),
        to: ctx.accounts.signer_token_account.to_account_info(),
        authority: ctx.accounts.program_token_account.to_account_info(),
    };
    transfer(CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds), total_price_outcome)?;

    // Add available outcome available to buy and deduct to user's outcome account
    if outcome == 0 {
        require!(ctx.accounts.market.num_outcome_0 > amount, CustomError::InsufficientOutcomeAvailable);
        ctx.accounts.market.num_outcome_0 += amount;
        ctx.accounts.outcome_account.amount_0 -= amount;
    } else {
        require!(ctx.accounts.market.num_outcome_1 > amount, CustomError::InsufficientOutcomeAvailable);
        ctx.accounts.market.num_outcome_1 += amount;
        ctx.accounts.outcome_account.amount_1 -= amount;
    }

    // Adjust prices according to LMSR formula
    let (price_0, price_1) = adjust_prices(&ctx);
    ctx.accounts.market.price_outcome_0 = price_0;
    ctx.accounts.market.price_outcome_1 = price_1;

    Ok(())
}

fn adjust_prices(ctx: &Context<BuySellOutcome>) -> (f64, f64) {
    let b = 10_f64;

    let e_q0_div_b = (ctx.accounts.market.num_outcome_0 as f64 / b).exp();
    let e_q1_div_b = (ctx.accounts.market.num_outcome_1 as f64 / b).exp();

    let denom = e_q0_div_b + e_q1_div_b;

    let price_0 = e_q0_div_b / denom;
    let price_1 = 1f64 - price_0;

    (price_0, price_1)
}