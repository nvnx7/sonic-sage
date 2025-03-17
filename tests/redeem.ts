import { expect } from "chai";
import {
  AnchorProvider,
  setProvider,
  workspace,
  BN,
  web3,
  utils,
} from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Account,
  createMint,
  getAccount,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { SonicSage } from "../target/types/sonic_sage";
import { setupProgram } from "./helpers";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { Connection } from "@solana/web3.js";

const ONE_DAY = 1000 * 60 * 60 * 24;

const logMarket = (market) => {
  console.log("market.price:", market.price.toString());
  console.log("market.priceFeedId:", market.priceFeedId);
  console.log("market.resolveFrom:", market.resolveFrom.toString());
  console.log("market.resolveTo:", market.resolveTo.toString());
  console.log("market.subsidyAmount:", market.subsidyAmount.toString());
  console.log("market.currentBalance:", market.currentBalance.toString());
  console.log("market.isResolved:", market.isResolved);
  console.log("market.outcome:", market.outcome);
  console.log("market.subsidyAmount:", market.subsidyAmount.toString());
  console.log("market.numOutcome0:", market.numOutcome0.toString());
  console.log("market.numOutcome1:", market.numOutcome1.toString());
  console.log("market.numOutcome0Held:", market.numOutcome0Held.toString());
  console.log("market.numOutcome1Held:", market.numOutcome1Held.toString());
  console.log("market.priceOutcome0:", market.priceOutcome0.toString());
  console.log("market.priceOutcome1:", market.priceOutcome1.toString());
};

describe.only("redeem outcome shares", () => {
  //   const provider = AnchorProvider.local();
  const provider1 = AnchorProvider.env();
  const wallet = provider1.wallet;
  const conn = new Connection("https://api.testnet.sonic.game");
  const provider = new AnchorProvider(conn, wallet);

  //   provider.connection._rpcEndpoint = "https://api.testnet.sonic.game";
  //   const provider = new AnchorProvider(
  //     new Connection("https://api.testnet.sonic.game")
  //   );
  //   setProvider(provider);
  const connection = provider.connection;
  const pg = workspace.SonicSage as Program<SonicSage>;
  const programId = pg.programId;
  const signer = provider.wallet.payer;
  const [metadataPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("metadata")],
    programId
  );
  const [programTokenAccountPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("token")],
    programId
  );
  let metadata;
  let marketPda: PublicKey;
  let mint: PublicKey;
  let signerTokenAccount: Account;

  before(async () => {
    // const x = await setupProgram({ pg, signer });
    // mint = x.mint;
    // signerTokenAccount = x.signerTokenAccount;
    // metadata = await pg.account.metadata.fetch(metadataPda);
    // [marketPda] = web3.PublicKey.findProgramAddressSync(
    //   [
    //     Buffer.from("market"),
    //     signer.publicKey.toBuffer(),
    //     metadata.marketCounter.toArrayLike(Buffer, "le", 8),
    //   ],
    //   programId
    // );
  });

  it.only("sonic setup", async () => {
    const [metadataPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("metadata")],
      programId
    );
    const [programTokenAccountPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("token")],
      programId
    );
    const mint = new web3.PublicKey(
      "88sV7y1ryDCiutfCUgqWvmkD9tUCBzdCLM8QqNhwgcAY"
    );
    const tokenProgramInf = await conn.getAccountInfo(TOKEN_PROGRAM_ID);
    console.log(
      "tokenProgramInf:",
      tokenProgramInf.owner.toBase58(),
      tokenProgramInf.data.length
    );

    const mint1 = await getMint(connection, mint);
    console.log("mintAcc:", mint1.address.toBase58(), mint1.decimals);

    const accounts = {
      metadata: metadataPda,
      tokenAccount: programTokenAccountPda,
      mint: mint1.address,
      signer: signer.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    };

    // Object.keys(accounts).map((k) => {
    //   console.log(k, accounts[k].toBase58());
    // });

    // console.log("provider:", pg.provider);

    const txHash = await pg.methods
      .setupMetadata()
      .accounts(accounts)
      .signers([signer])
      .rpc()
      .catch((err) => {
        console.log(err);
      });
    console.log(`setup:txHash: ${txHash}`);
  });

  it("sonic token", async () => {
    console.log("provider:", provider);

    // const x1 = await createMint(
    //   connection,
    //   signer,
    //   signer.publicKey,
    //   signer.publicKey,
    //   9
    // );
    // console.log("mint:", x1.toBase58());

    const mint = new web3.PublicKey(
      "88sV7y1ryDCiutfCUgqWvmkD9tUCBzdCLM8QqNhwgcAY"
    );
    const ss = new web3.PublicKey(
      "FVeerek7gKGqhSSqWFbWuSkPBeuZgCL7Gix66DDu4v4Z"
    );
    let tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      signer,
      mint,
      //   signer.publicKey
      ss
    );
    console.log(
      "tokenAccount:",
      tokenAccount.address.toBase58(),
      tokenAccount.amount.toString()
    );

    await mintTo(
      connection,
      signer,
      mint,
      tokenAccount.address,
      signer,
      20000 * LAMPORTS_PER_SOL
    );
    tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      signer,
      mint,
      //   signer.publicKey
      ss
    );
    console.log(
      "tokenAccount:",
      tokenAccount.address.toBase58(),
      tokenAccount.amount.toString()
    );
  });

  it.skip("redeem successfully", async () => {
    const price = 200.5;
    const resolveFrom = new BN(Date.now() + ONE_DAY);
    const resolveTo = new BN(Date.now() + ONE_DAY * 2);
    const subsidyAmount = new BN(100);
    const priceFeedId =
      "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";

    const createMarketAccounts = {
      market: marketPda,
      metadata: metadataPda,
      mint,
      signerTokenAccount: signerTokenAccount.address,
      programTokenAccount: programTokenAccountPda,
      signer: signer.publicKey,
      tokenProgram: utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    };

    const sig1 = await pg.methods
      .createMarket(price, priceFeedId, resolveFrom, resolveTo, subsidyAmount)
      .accounts(createMarketAccounts)
      .signers([signer])
      .rpc()
      .catch((err) => {
        console.log("createMarketError:", err);
      });
    console.log("Market created:", sig1);

    // Fetch updated accounts
    metadata = await pg.account.metadata.fetch(metadataPda);
    let market = await pg.account.market.fetch(marketPda);
    const mintAccount = await getMint(connection, mint);
    const mintAccountDecimals = mintAccount.decimals;
    let programTokenAccount = await getAccount(
      connection,
      programTokenAccountPda
    );
    // console.log("mint", mintAccount.address.toBase58(), mintAccount.decimals);
    // console.log(
    //   "programTokenAccount",
    //   programTokenAccount.amount.toString(),
    //   programTokenAccount.mint.toBase58()
    // );

    const totalSubsidyProvided = programTokenAccount.amount.toString();
    logMarket(market);
    console.log("totalSubsidyProvided:", totalSubsidyProvided);

    const numBuyOutcome0 = subsidyAmount.div(new BN(10));
    const [outcomeAccountPda] = await web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("outcome"),
        marketPda.toBuffer(),
        signer.publicKey.toBuffer(),
      ],
      programId
    );
    const buyOutcomeAccounts = {
      market: marketPda,
      subsidyMint: mint,
      signerTokenAccount: signerTokenAccount.address,
      programTokenAccount: programTokenAccountPda,
      outcomeAccount: outcomeAccountPda,
      signer: signer.publicKey,
      tokenProgram: utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    };
    const sig2 = await pg.methods
      .buyOutcome(0, numBuyOutcome0)
      .accounts(buyOutcomeAccounts)
      .signers([signer])
      .rpc()
      .catch((err) => {
        console.log(err);
      });
    console.log("Outcome bought:", sig2);

    const outcomeAccount = await pg.account.outcomeAccount.fetch(
      outcomeAccountPda
    );
    market = await pg.account.market.fetch(marketPda);
    programTokenAccount = await getAccount(connection, programTokenAccountPda);
    // console.log("programTokenAccount:", programTokenAccount.amount.toString());
    console.log("========AFTER BUY OUTCOME========");
    logMarket(market);
    console.log("totalSubsidyProvided:", totalSubsidyProvided);

    const resolveMarketAccounts = {
      market: marketPda,
      signer: signer.publicKey,
      systemProgram: web3.SystemProgram.programId,
    };

    const sig3 = await pg.methods
      .resolveMarket()
      .accounts(resolveMarketAccounts)
      .signers([signer])
      .rpc()
      .catch((err) => {
        console.log(err);
      });
    console.log("Market resolved:", sig3);
    market = await pg.account.market.fetch(marketPda);
    console.log("========AFTER RESOLVE MARKET========");
    logMarket(market);

    const redeemOutcomeAccounts = {
      market: marketPda,
      subsidyMint: mint,
      signerTokenAccount: signerTokenAccount.address,
      programTokenAccount: programTokenAccountPda,
      outcomeAccount: outcomeAccountPda,
      signer: signer.publicKey,
      tokenProgram: utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    };
    const sig4 = await pg.methods
      .redeemOutcome()
      .accounts(redeemOutcomeAccounts)
      .signers([signer])
      .rpc()
      .catch((err) => {
        console.log(err);
      });
    console.log("Outcome redeemed:", sig4);
    market = await pg.account.market.fetch(marketPda);
    console.log("========AFTER REDEEM OUTCOME========");
    logMarket(market);
  });
});
