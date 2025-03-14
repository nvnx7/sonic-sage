use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct OutcomeAccount {
    pub amount_0: u64,
    pub amount_1: u64,
}