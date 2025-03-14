use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::{PriceUpdateV2, get_feed_id_from_hex};

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub market: Account<'info, Market>,

    pub price_update: Account<'info, PriceUpdateV2>,
}

pub fn resolve_market(ctx: Context<ResolveMarket>) -> Result<()> {
    // require!(!ctx.accounts.market.is_resolved, MarketAlreadyResolved);
    let feed_id = get_feed_id_from_hex("0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43");
    let price = ctx.accounts.price_update.price;    
    ctx.accounts.market.is_resolved = true;
    Ok(())
}