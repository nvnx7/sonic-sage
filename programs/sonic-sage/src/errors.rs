use anchor_lang::prelude::*;

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
