use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

#[account]
pub struct Metadata {
    pub market_counter: u64,
}
