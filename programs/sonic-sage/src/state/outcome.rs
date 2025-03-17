use anchor_lang::prelude::*;

/// Account to store the outcome shares of a user.
#[account]
#[derive(InitSpace)]
pub struct OutcomeAccount {
    /// Balance of shares of outcome 0.
    pub amount_0: u64,

    /// Balance of shares of outcome 1.
    pub amount_1: u64,
}