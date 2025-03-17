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
import { Account, getAccount, getMint } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { SonicSage } from "../target/types/sonic_sage";
import { setupProgram } from "./helpers";

const ONE_DAY = 1000 * 60 * 60 * 24;

describe.skip("buy outcome", () => {
  const provider = AnchorProvider.local();
  setProvider(provider);
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
    const x = await setupProgram({ pg, signer });
    mint = x.mint;
    signerTokenAccount = x.signerTokenAccount;

    metadata = await pg.account.metadata.fetch(metadataPda);
    [marketPda] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("market"),
        signer.publicKey.toBuffer(),
        metadata.marketCounter.toArrayLike(Buffer, "le", 8),
      ],
      programId
    );
  });

  it("buy outcome", async () => {
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

    await pg.methods
      .createMarket(price, priceFeedId, resolveFrom, resolveTo, subsidyAmount)
      .accounts(createMarketAccounts)
      .signers([signer])
      .rpc();
    //   .catch((err) => { console.log(err); });

    // Fetch updated accounts
    metadata = await pg.account.metadata.fetch(metadataPda);
    let market = await pg.account.market.fetch(marketPda);
    const mintAccount = await getMint(connection, mint);
    const mintAccountDecimals = mintAccount.decimals;
    let programTokenAccount = await getAccount(
      connection,
      programTokenAccountPda
    );
    console.log("mint", mintAccount.address.toBase58(), mintAccount.decimals);
    console.log(
      "programTokenAccount",
      programTokenAccount.amount.toString(),
      programTokenAccount.mint.toBase58()
    );

    const totalSubsidyProvided = programTokenAccount.amount.toString();

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
    console.log("market.priceOutcome0:", market.priceOutcome0.toString());
    console.log("market.priceOutcome1:", market.priceOutcome1.toString());
    console.log("totalSubsidyProvided:", totalSubsidyProvided);

    // expect(metadata.marketCounter.toString()).to.equal('1');
    // expect(market.minPrice.toString()).to.equal(minPrice.toString());
    // expect(market.maxPrice.toString()).to.equal(maxPrice.toString());
    // expect(market.resolveAt.toString()).to.equal(resolveAt.toString());
    // expect(market.subsidyAmount.toString()).to.equal(subsidyAmount.toString());
    // expect(market.numOutcome0.toString()).to.equal(subsidyAmount.toString());
    // expect(market.numOutcome1.toString()).to.equal(subsidyAmount.toString());
    // expect(market.priceOutcome0.toString()).to.equal('0.5');
    // expect(market.priceOutcome1.toString()).to.equal('0.5');
    // expect(market.isResolved).to.equal(false);
    // expect(market.outcome).to.equal(null);
    // expect(totalSubsidyProvided).to.equal(subsidyAmount.mul(new BN(10 ** mintAccountDecimals)).toString());

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
    const txHash = await pg.methods
      .buyOutcome(0, numBuyOutcome0)
      .accounts(buyOutcomeAccounts)
      .signers([signer])
      .rpc()
      .catch((err) => {
        console.log(err);
      });
    console.log("txHash:", txHash);

    const outcomeAccount = await pg.account.outcomeAccount.fetch(
      outcomeAccountPda
    );
    market = await pg.account.market.fetch(marketPda);
    programTokenAccount = await getAccount(connection, programTokenAccountPda);
    console.log("programTokenAccount:", programTokenAccount.amount.toString());

    console.log("========AFTER BUY OUTCOME========");
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
    console.log("market.priceOutcome0:", market.priceOutcome0.toString());
    console.log("market.priceOutcome1:", market.priceOutcome1.toString());
    console.log("totalSubsidyProvided:", totalSubsidyProvided);

    expect(outcomeAccount.amount0.toString()).to.equal(
      numBuyOutcome0.toString()
    );
    expect(outcomeAccount.amount1.toString()).to.equal("0");
  });
});
