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

    /// Initializes the metadata for the program.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context containing the necessary accounts and information to set up metadata.
    pub fn setup_metadata(ctx: Context<Setup>) -> Result<()> {
        setup::setup_metadata(ctx)
    }

    /// Creates a new prediction market with initial liquidity subsidy.
    /// 
    /// # Arguments
    /// 
    /// * `ctx` - The context containing the necessary accounts and information to create a market.
    /// * `price` - The predicted price for the market.
    /// * `price_feed_id` - The identifier for the Pyth price feed used for resolution.
    /// * `resolve_from` - The timestamp from which the price feed data is considered valid.
    /// * `resolve_to` - The timestamp until which the price feed data is considered valid.
    /// * `subsidy_amount` - The amount of liquidity subsidy to provide for the market.
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

    /// Buys outcome shares for a specific outcome in a market.
    /// 
    /// # Arguments
    /// 
    /// * `ctx` - The context containing the necessary accounts and information to buy outcome tokens.
    /// * `outcome_idx` - The outcome idx for which to buy shares.
    /// * `num_shares` - The number of shares to buy.
    pub fn buy_outcome(
        ctx: Context<BuySellOutcome>,
        outcome_idx: u8,
        num_shares: u64
    ) -> Result<()> { 
        buy_sell::buy_outcome(ctx, outcome_idx, num_shares)
    }

    /// Sells outcome shares for a specific outcome in a market.
    /// 
    /// # Arguments
    /// 
    /// * `ctx` - The context containing the necessary accounts and information to sell outcome tokens.
    /// * `outcome_idx` - The outcome idx for which to sell shares.
    /// * `num_shares` - The number of shares to sell.
    pub fn sell_outcome(
        ctx: Context<BuySellOutcome>,
        outcome_idx: u8,
        num_shares: u64
    ) -> Result<()> { 
        buy_sell::sell_outcome(ctx, outcome_idx, num_shares)
    }

    /// Resolves a market by comparing the target price to the actual price from oracle.
    /// 
    /// # Arguments
    /// 
    /// * `ctx` - The context containing the necessary accounts and information to resolve a market.
    pub fn resolve_market(ctx: Context<ResolveMarket>) -> Result<()> {
        resolve::resolve_market(ctx)
    }

    /// Redeems winning outcome shares after market resolution.
    /// 
    /// # Arguments
    /// 
    /// * `ctx` - The context containing the necessary accounts and information to redeem outcome tokens.
    pub fn redeem_outcome(ctx: Context<RedeemOutcome>) -> Result<()> {
        redeem::redeem_outcome(ctx)
    }
}
