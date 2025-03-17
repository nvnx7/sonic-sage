use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub id: u64,
    pub price: f64,
    #[max_len(66)]
    pub price_feed_id: String,
    pub created_at: u64,
    pub resolve_from: u64,
    pub resolve_to: u64,
    pub subsidy_amount: u64, // In whole token units, not with decimals
    pub current_balance: u64,
    pub num_outcome_0: u64,
    pub num_outcome_1: u64,
    pub num_outcome_0_held: u64,
    pub num_outcome_1_held: u64,
    pub price_outcome_0: f64,
    pub price_outcome_1: f64,
    pub is_resolved: bool,
    pub outcome: Option<u8>,
}