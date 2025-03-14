pub mod errors;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use errors::*;
pub use instructions::*;
pub use state::*;

// Program's public key
declare_id!("8F17NFTtu82uWQuXWYDE81vAdfFf6UKdtZNjGVtrakMF");

#[program]
mod sonic_sage {
    use super::*;

    pub fn setup_metadata(ctx: Context<Setup>) -> Result<()> {
        setup::setup_metadata(ctx)
    }

    pub fn create_market(
        ctx: Context<CreateMarket>,
        min_price: u64,
        max_price: u64,
        resolve_at: u64,
        subsidy_amount: u64,
    ) -> Result<()> {
        create::create_market(ctx, min_price, max_price, resolve_at, subsidy_amount)
    }

    // pub fn resolve_market(ctx: Context<ResolveMarket>) -> Result<()> {
    //     resolve::resolve_market(ctx)
    // }
}
