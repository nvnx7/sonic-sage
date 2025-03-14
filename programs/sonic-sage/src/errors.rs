use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    InvalidResolveTime,
    InvalidPriceRange,
    InvalidOutcome,
    InsufficientOutcomeAvailable,
    MarketAlreadyResolved,
    MarketNotResolvedYet,
}
