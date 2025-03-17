pub mod errors;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use errors::*;
pub use instructions::*;
pub use state::*;

// Program's public key
declare_id!("7JoThMj3epYFva6TBDQVDGDrn92Uncwj8vB11SJQUUPn");

#[program]
mod sonic_sage {
    use super::*;

    pub fn setup_metadata(ctx: Context<Setup>) -> Result<()> {
        setup::setup_metadata(ctx)
    }

    pub fn create_market(
        ctx: Context<CreateMarket>,
        price: f64,
        price_feed_id: String,
        resolve_from: u64,
        resolve_to: u64,
        subsidy_amount: u64
    ) -> Result<()> {
        create::create_market(ctx, price, price_feed_id, resolve_from, resolve_to, subsidy_amount)
    }

    pub fn buy_outcome(
        ctx: Context<BuySellOutcome>,
        outcome: u8,
        amount: u64
    ) -> Result<()> { 
        buy_sell::buy_outcome(ctx, outcome, amount)
    }

    pub fn sell_outcome(
        ctx: Context<BuySellOutcome>,
        outcome: u8,
        amount: u64
    ) -> Result<()> { 
        buy_sell::sell_outcome(ctx, outcome, amount)
    }
    
    pub fn resolve_market(ctx: Context<ResolveMarket>) -> Result<()> {
        resolve::resolve_market(ctx)
    }

    pub fn redeem_outcome(ctx: Context<RedeemOutcome>) -> Result<()> {
        redeem::redeem_outcome(ctx)
    }
}
