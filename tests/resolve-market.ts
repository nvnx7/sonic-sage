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
  getAccount,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { SonicSage } from "../target/types/sonic_sage";
import { mintToken, setupProgram } from "./helpers";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
// import { HermesClient } from "@pythnetwork/hermes-client";
// const { PythSolanaReceiver } = require("@pythnetwork/pyth-solana-receiver");

const ONE_DAY = 1000 * 60 * 60 * 24;

describe.skip("resolve market", () => {
  // const provider = AnchorProvider.local();
  const provider = AnchorProvider.env();
  setProvider(provider);
  const connection = provider.connection;
  const pg = workspace.SonicSage as Program<SonicSage>;
  const programId = pg.programId;
  const wallet = provider.wallet;
  const signer = (wallet as any).payer as web3.Keypair;
  //   console.log('signer', signer.payer);

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

  it("resolve market", async () => {
    const price = 200.5;
    const resolveFrom = new BN(Date.now() + ONE_DAY);
    const resolveTo = new BN(Date.now() + ONE_DAY * 2);
    const subsidyAmount = new BN(100);

    // Update for btc/usd
    const priceFeedId =
      "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";
    const priceFeedAddress = new web3.PublicKey(
      "4cSM2e6rvbGQUFiJbqytoVMi5GgghSMr8LwVrT9VPSPo"
    );
    const priceFeedAccountInfo = await connection.getAccountInfo(
      priceFeedAddress
    );
    console.log(
      "priceFeedAccountInfo",
      priceFeedAccountInfo?.data.length,
      priceFeedAccountInfo?.owner.toBase58()
    );

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

    const createMarketTxHash = await pg.methods
      .createMarket(price, priceFeedId, resolveFrom, resolveTo, subsidyAmount)
      .accounts(createMarketAccounts)
      .signers([signer])
      .rpc();
    //   .catch((err) => { console.log(err); });

    console.log(`creatMarketTxHash: ${createMarketTxHash}`);

    const resolveMarketAccounts = {
      market: marketPda,
      priceUpdate: priceFeedAddress,
      signer: signer.publicKey,
      systemProgram: web3.SystemProgram.programId,
    };

    const txHash = await pg.methods
      .resolveMarket()
      .accounts(resolveMarketAccounts)
      .signers([signer])
      .rpc()
      .catch((err) => {
        console.log(err);
      });

    console.log(`txHash: ${txHash}`);

    const tx = await connection.getTransaction(txHash as string);
    console.log("tx", tx);
    console.log("tx.logs", tx?.logMessages);

    // Fetch updated accounts
    metadata = await pg.account.metadata.fetch(metadataPda);
    const market = await pg.account.market.fetch(marketPda);
    // const mintAccount = await getMint(connection, mint);
    // const mintAccountDecimals = mintAccount.decimals;
    const programTokenAccount = await getAccount(
      connection,
      programTokenAccountPda
    );
    // console.log('mint', mintAccount.address.toBase58(), mintAccount.decimals);
    // console.log('programTokenAccount', programTokenAccount.amount.toString(), programTokenAccount.mint.toBase58());

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
  });
});
