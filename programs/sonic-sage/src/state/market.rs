use anchor_lang::prelude::*;

/// Represents a prediction market where users can trade outcomes of future events
/// The Market struct stores all the essential information about a binary prediction market.
#[account]
#[derive(InitSpace)]
pub struct Market {
    /// Unique identifier for the market
    pub id: u64,

    /// Predicted price of the asset
    pub price: f64,

    /// The Pyth price feed ID, used to fetch the price of the speculated asset
    #[max_len(66)]
    pub price_feed_id: String,

    /// The time when the market was created (in seconds)
    pub created_at: u64,

    /// The time when the market resolution starts (in milliseconds)
    pub resolve_from: u64,

    /// The time when the market resolution ends (in milliseconds)
    pub resolve_to: u64,

    /// The amount of subsidy that the market maker provided
    /// In whole token units, not with decimals.
    pub subsidy_amount: u64,

    /// The current balance of tokens in the market
    pub current_balance: u64,

    /// The number of shares of outcome 0 acc. to LMSR
    pub num_outcome_0: u64,

    /// The number of shares of outcome 1 acc. to LMSR
    pub num_outcome_1: u64,

    /// Total number of shares of outcome 0 held by users
    pub num_outcome_0_held: u64,

    /// Total number of shares of outcome 1 held by users
    pub num_outcome_1_held: u64,

    /// Current price of outcome 0 acc. to LMSR
    pub price_outcome_0: f64,

    /// Current price of outcome 1 acc. to LMSR
    pub price_outcome_1: f64,

    /// Flag to indicate if the market is resolved
    pub is_resolved: bool,

    /// The winning outcome of the market
    pub outcome: Option<u8>,
}