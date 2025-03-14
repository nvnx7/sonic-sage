use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Metadata {
    pub market_counter: u64,
}
