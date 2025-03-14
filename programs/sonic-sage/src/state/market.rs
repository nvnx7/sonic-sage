use anchor_lang::prelude::*;

#[account]
pub struct Market {
    pub id: u64,
    pub min_price: u64,
    pub max_price: u64,
    pub created_at: u64,
    pub resolve_at: u64,
    pub is_resolved: bool,
    pub outcome: Option<u8>,
}
