// use pyth_sdk_solana::{load_price_feed_from_account_info, PriceFeed};
// use solana_program::pubkey::Pubkey;
// use {
//     anchor_lang::prelude::*,
//     anchor_spl::{
//         associated_token::AssociatedToken,
//         token::{transfer, Mint, Token, TokenAccount, Transfer},
//     },
// };

// use crate::state::market::Market;

// #[derive(Accounts)]
// pub struct ResolveMarket<'info> {
//     // #[account(
//     //     mut,
//     //     seeds = [b"market", signer.key().as_ref(), &id.to_le_bytes()],
//     //     bump
//     // )]
//     // pub market: Account<'info, Market>,
//     // #[account(address = Pubkey::new(&[197, 224, 224, 201, 33, 22, 192, 192, 112, 162, 66, 178, 84, 39, 4, 65, 166, 32, 26, 246, 128, 163, 62, 3, 129, 86, 28, 89, 219, 50, 102, 201]))]
//     // #[account(address = Pubkey::from_str("BfkyhX5Uy4DJLdoGC2BY99oe55TjG7hWEwDrx6VBJHcL"))]
//     #[account(address = Pubkey::new(&[158, 130, 170, 100, 132, 50, 71, 95, 91, 95, 83, 159, 26, 193, 108, 22, 12, 85, 70, 28, 209, 217, 139, 106, 35, 96, 72, 135, 180, 238, 112, 201]))]
//     pub price_feed: AccountInfo<'info>,

//     #[account(mut)]
//     pub signer: Signer<'info>,

//     pub system_program: Program<'info, System>,
// }

// pub fn resolve_market(ctx: Context<ResolveMarket>) -> Result<()> {
//     // let now = Clock::get()?.unix_timestamp.try_into().unwrap();
//     // require!(
//     //     now >= ctx.accounts.market.resolve_at,
//     //     MyError::InvalidResolveTime
//     // );

//     let price_feed_acc = &ctx.accounts.price_feed;
//     let price_feed = load_price_feed_from_account_info(price_feed_acc)
//         .ok()
//         .unwrap();

//     let current_timestamp = Clock::get()?.unix_timestamp;
//     let current_price = price_feed
//         .get_price_no_older_than(current_timestamp, 60)
//         .unwrap();
//     msg!("Current Price {}", current_price.price);

//     // ctx.accounts.market.is_resolved = true;
//     // ctx.accounts.market.outcome = Some(0);
//     Ok(())
// }
