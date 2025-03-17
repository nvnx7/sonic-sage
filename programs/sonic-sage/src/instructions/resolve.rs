use std::ops::Div;

use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::{PriceUpdateV2, get_feed_id_from_hex};

use crate::state::market::Market;

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub market: Account<'info, Market>,

    // pub price_update: Account<'info, PriceUpdateV2>,
}

pub fn resolve_market(ctx: Context<ResolveMarket>) -> Result<()> {
    ctx.accounts.market.outcome = Some(0);
    ctx.accounts.market.is_resolved = true;
    // let price_update = &mut ctx.accounts.price_update;
    // let maximum_age: u64 = 60;
    // let feed_id: [u8; 32] = get_feed_id_from_hex(&ctx.accounts.market.price_feed_id)?;
    // let price = price_update.get_price_no_older_than(&Clock::get()?, maximum_age, &feed_id)?;
    // msg!("The price is ({} ± {}) * 10^{}", price.price, price.conf, price.exponent);

    // let pos_exp = (-1 * price.exponent) as u32;
    // let actual_price = (price.price as f64).div(10u64.pow(pos_exp as u32) as f64);
    // let target_price = ctx.accounts.market.price;
    // msg!("Actual price: {}", actual_price);
    // msg!("Target price: {}", target_price);

    // if target_price >= actual_price {
    //     ctx.accounts.market.outcome = Some(0);
    // } else {
    //     ctx.accounts.market.outcome = Some(1);
    // }
    // ctx.accounts.market.is_resolved = true;

    Ok(())
}