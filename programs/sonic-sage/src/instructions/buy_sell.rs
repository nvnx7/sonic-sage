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

/// Liquidity parameter for the LMSR (Logarithmic Market Scoring Rule) pricing model
/// Controls market price sensitivity - higher values create less price movement per trade
const LIQUIDITY_CONSTANT: u64 = 50;

// Context for buying and selling outcome tokens
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

/// Buy outcome shares for a given market
///
/// Uses LMSR (Logarithmic Market Scoring Rule) to calculate token price
/// and executes token transfers between user and program accounts
///
/// # Arguments
///
/// * `ctx` - BuySellOutcome context containing required accounts
/// * `outcome_idx` - Index of outcome to buy (0 or 1)
/// * `num_shares` - Number of outcome shares to purchase
///
/// # Errors
///
/// Returns error if market is already resolved, outcome index is invalid
pub fn buy_outcome(
    ctx: Context<BuySellOutcome>,
    outcome_idx: u8,
    num_shares: u64
) -> Result<()> {
    require!(!ctx.accounts.market.is_resolved, CustomError::MarketAlreadyResolved);
    require!(outcome_idx == 0 || outcome_idx == 1, CustomError::InvalidOutcome);

    let const_before = calculate_cost(&ctx);

    if outcome_idx == 0 {
        ctx.accounts.market.num_outcome_0 += num_shares;
    } else {
        ctx.accounts.market.num_outcome_1 += num_shares;
    }

    let cost_after = calculate_cost(&ctx);

    let cost_to_buy = cost_after - const_before;
    let cost_in_tokens = (cost_to_buy * 10u64.pow(ctx.accounts.subsidy_mint.decimals as u32) as f64) as u64;
    
    // Transfer the amount of subsidy tokens to the program
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.signer_token_account.to_account_info(),
        to: ctx.accounts.program_token_account.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
    };
    transfer(CpiContext::new(cpi_program, cpi_accounts), cost_in_tokens)?;

    // Store adjusted prices according to LMSR formula
    let (price_0, price_1) = get_prices(&ctx);
    ctx.accounts.market.price_outcome_0 = price_0;
    ctx.accounts.market.price_outcome_1 = price_1;

    // Update the balance of the market
    ctx.accounts.market.current_balance += cost_in_tokens;

    // Update user outcomes shares
    if outcome_idx == 0 {
        ctx.accounts.outcome_account.amount_0 += num_shares;
        ctx.accounts.market.num_outcome_0_held += num_shares;
    } else {
        ctx.accounts.outcome_account.amount_1 += num_shares;
        ctx.accounts.market.num_outcome_1_held += num_shares;
    }

    Ok(())
}

/// Sell outcome shares back to the market
///
/// Uses LMSR (Logarithmic Market Scoring Rule) to calculate sale price
/// and executes token transfers between program and user accounts
///
/// # Arguments
///
/// * `ctx` - BuySellOutcome context containing required accounts
/// * `outcome_idx` - Index of outcome to sell (0 or 1)
/// * `num_shares` - Number of outcome share to sell
///
/// # Errors
///
/// Returns error if market is already resolved, outcome index is invalid,
pub fn sell_outcome(
    ctx: Context<BuySellOutcome>,
    outcome_idx: u8,
    num_shares: u64
) -> Result<()> {
    require!(!ctx.accounts.market.is_resolved, CustomError::MarketAlreadyResolved);
    require!(outcome_idx == 0 || outcome_idx == 1, CustomError::InvalidOutcome);
    
    let const_before = calculate_cost(&ctx);

    if outcome_idx == 0 {
        ctx.accounts.market.num_outcome_0 -= num_shares;
    } else {
        ctx.accounts.market.num_outcome_1 -= num_shares;
    }

    let cost_after = calculate_cost(&ctx);

    let cost_to_buy = cost_after - const_before;
    let cost_in_tokens = (cost_to_buy * 10u64.pow(ctx.accounts.subsidy_mint.decimals as u32) as f64) as u64;

    let signer_seeds: &[&[&[u8]]] = &[&[b"token", &[ctx.bumps.program_token_account]]];
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.program_token_account.to_account_info(),
        to: ctx.accounts.signer_token_account.to_account_info(),
        authority: ctx.accounts.program_token_account.to_account_info(),
    };
    transfer(CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds), cost_in_tokens)?;

    // Store adjusted prices according to LMSR formula
    let (price_0, price_1) = get_prices(&ctx);
    ctx.accounts.market.price_outcome_0 = price_0;
    ctx.accounts.market.price_outcome_1 = price_1;

    // Update the balance of the market
    ctx.accounts.market.current_balance -= cost_in_tokens;

    // Update user outcomes shares
    if outcome_idx == 0 {
        ctx.accounts.outcome_account.amount_0 -= num_shares;
        ctx.accounts.market.num_outcome_0_held -= num_shares;
    } else {
        ctx.accounts.outcome_account.amount_1 -= num_shares;
        ctx.accounts.market.num_outcome_1_held -= num_shares;
    }

    Ok(())
}

/// Calculate the cost function for the market using LMSR
///
/// Implements C(q) = b * ln(exp(q_0/b) + exp(q_1/b))
/// where q_0 and q_1 are the quantities of outcome tokens
/// and b is the liquidity constant
///
/// # Arguments
///
/// * `ctx` - BuySellOutcome context containing market state
///
/// # Returns
///
/// The cost value according to the LMSR formula
fn calculate_cost(ctx: &Context<BuySellOutcome>) -> f64 {
    let b = LIQUIDITY_CONSTANT;
    let exp_no = (ctx.accounts.market.num_outcome_1).checked_div(b).unwrap_or_default();
    let exp_yes = (ctx.accounts.market.num_outcome_0).checked_div(b).unwrap_or_default();

    // Approximate the natural log sum of exponentials
    // C(q) = b * ln(exp(q_yes/b) + exp(q_no/b))
    // For safety, we use the max exponential and add the difference
    let max_exp = exp_yes.max(exp_no);
    let diff = ((exp_yes - max_exp) as f64).exp() + ((exp_no - max_exp) as f64).exp();
    
    (b as f64) * (max_exp as f64 + diff.ln())
}

/// Calculate market prices for each outcome based on LMSR
///
/// Calculates p_i = exp(q_i/b) / sum_j(exp(q_j/b))
/// where p_i is the price of outcome i
///
/// # Arguments
///
/// * `ctx` - BuySellOutcome context containing market state
///
/// # Returns
///
/// Tuple of (price_0, price_1) representing probabilities of each outcome
fn get_prices(ctx: &Context<BuySellOutcome>) -> (f64, f64) {
    let b = LIQUIDITY_CONSTANT as f64;

    let exp_0 = (ctx.accounts.market.num_outcome_0 as f64 / b).exp();
    let exp_1 = (ctx.accounts.market.num_outcome_1 as f64 / b).exp();
    let sum = exp_0 + exp_1;

    let price_0 = exp_0 / sum;
    let price_1 = 1f64 - price_0;

    (price_0, price_1)
}