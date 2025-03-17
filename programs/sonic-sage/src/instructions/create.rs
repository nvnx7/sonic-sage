use {
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::AssociatedToken,
        token::{transfer, Mint, Token, TokenAccount, Transfer},
    },
};

use crate::errors::*;
use crate::state::market::Market;
use crate::state::metadata::Metadata;

#[derive(Accounts)]
#[instruction(price: u64, price_feed_id: String, resolve_from: u64, resolve_to: u64, subsidy_amount: u64)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", signer.key().as_ref(), &metadata.market_counter.to_le_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub metadata: Account<'info, Metadata>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = signer
    )]
    pub signer_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"token"],
        bump
    )]
    pub program_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn create_market(
    ctx: Context<CreateMarket>,
    price: f64,
    price_feed_id: String,
    resolve_from: u64,
    resolve_to: u64,
    subsidy_amount: u64
) -> Result<()> {
    require!(resolve_from < resolve_to, CustomError::InvalidResolveWindow);
    let created_at = Clock::get()?.unix_timestamp.try_into().unwrap();
    require!(resolve_to >= created_at, CustomError::InvalidResolveTime);

    // Set market data
    ctx.accounts.market.id = ctx.accounts.metadata.market_counter;
    ctx.accounts.market.price = price;
    ctx.accounts.market.price_feed_id = price_feed_id;
    ctx.accounts.market.resolve_from = resolve_from;
    ctx.accounts.market.resolve_to = resolve_to;
    ctx.accounts.market.created_at = created_at;
    ctx.accounts.market.subsidy_amount = subsidy_amount;
    ctx.accounts.market.current_balance = subsidy_amount * (10u64.pow(ctx.accounts.mint.decimals as u32));
    ctx.accounts.market.num_outcome_0 = subsidy_amount;
    ctx.accounts.market.num_outcome_1 = subsidy_amount;
    ctx.accounts.market.num_outcome_0_held = 0;
    ctx.accounts.market.num_outcome_1_held = 0;
    ctx.accounts.market.price_outcome_0 = 0.5f64;
    ctx.accounts.market.price_outcome_1 = 0.5f64;
    ctx.accounts.market.is_resolved = false;
    ctx.accounts.market.outcome = None;

    // Increment market counter
    ctx.accounts.metadata.market_counter += 1;

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
        subsidy_amount * (10u64.pow(ctx.accounts.mint.decimals as u32)),
    )?;

    Ok(())
}
