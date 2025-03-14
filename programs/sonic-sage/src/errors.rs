use anchor_lang::prelude::*;

#[error_code]
pub enum MyError {
    #[msg("Invalid resolve time")]
    InvalidResolveTime,

    #[msg("Market already resolved")]
    MarketAlreadyResolved
}
