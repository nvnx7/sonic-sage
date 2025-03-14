use anchor_lang::prelude::*;

#[account]
pub struct OutcomeAccount {
    pub amount: u64,
}