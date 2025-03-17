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

    expect(market.isResolved).to.equal(false);
    expect(market.outcome).to.equal(null);
    expect(market.numOutcome0.toString()).to.equal(
      subsidyAmount.add(numBuyOutcome0).toString()
    );
    expect(market.numOutcome1.toString()).to.equal(subsidyAmount.toString());
    expect(market.priceOutcome0).to.be.greaterThan(0.5);
    expect(market.priceOutcome1).to.be.lessThan(0.5);
  });
});
