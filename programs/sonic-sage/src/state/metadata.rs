use anchor_lang::prelude::*;

/// Account to store the metadata of the program.
#[account]
#[derive(InitSpace)]
pub struct Metadata {
    /// Counter to keep track of the number of markets created.
    /// Also used as incremental identifier for the markets.
    pub market_counter: u64,
}
