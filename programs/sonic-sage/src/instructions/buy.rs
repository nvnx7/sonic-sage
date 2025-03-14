use {
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::AssociatedToken,
        token::{transfer, Mint, Token, TokenAccount, Transfer},
    },
};

use crate::errors::MyError::{MarketAlreadyResolved, InvalidResolveTime};
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
        space = 8 + 8,
        seeds = [b"outcome_0", market.key().as_ref(), signer.key().as_ref()],
        bump
    )]
    pub outcome_0_account: Account<'info, OutcomeAccount>,

    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + 8,
        seeds = [b"outcome_1", market.key().as_ref(), signer.key().as_ref()],
        bump
    )]
    pub outcome_1_account: Account<'info, OutcomeAccount>,

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
    // require!(!ctx.accounts.market.is_resolved, MarketAlreadyResolved);
    
    let outcome_price = get_outcome_price(&ctx, outcome, amount);
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.signer_token_account.to_account_info(),
        to: ctx.accounts.program_token_account.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
    };
    transfer(
        CpiContext::new(
            cpi_program,
            cpi_accounts
        ),
        outcome_price,
    )?;

    // Deduct available outcome available to buy and add to user's account
    // if (outcome == 0) {
    //     require!(ctx.accounts.market.num_outcome_0 >= amount, MyError::InsufficientLiquidity);
    //     ctx.accounts.market.num_outcome_0 -= amount;
    //     ctx.accounts.outcome_0_account.amount += amount;
    // } else {
    //     require!(ctx.accounts.market.num_outcome_1 >= amount, MyError::InsufficientLiquidity);
    //     ctx.accounts.market.num_outcome_1 -= amount;
    //     ctx.accounts.outcome_1_account.amount += amount;

    Ok(())
}

fn get_outcome_price(ctx: &Context<BuySellOutcome>, outcome: u8, amount: u64) -> u64 {
    1
}