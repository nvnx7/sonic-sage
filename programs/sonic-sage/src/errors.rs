use anchor_lang::prelude::*;

/// Custom error types for market operations
#[error_code]
pub enum CustomError {
    InvalidResolveTime,
    InvalidResolveWindow,
    InvalidOutcome,
    InsufficientOutcomeAvailable,
    MarketAlreadyResolved,
    MarketNotResolvedYet,
    MetadataAlreadyInitialized,
}
