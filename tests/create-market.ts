import { expect } from "chai";
import { AnchorProvider, setProvider, workspace, BN, web3, utils } from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Account, getAccount } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { SonicSage } from "../target/types/sonic_sage";
import { setupProgram } from "./helpers";

const ONE_DAY = 1000 * 60 * 60 * 24;

describe.only("create market",  () => {
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
        [Buffer.from("market"), signer.publicKey.toBuffer(), metadata.marketCounter.toArrayLike(Buffer, "le", 8)],
        programId
      );
  });

  it("create market", async () => {
    const minPrice = new BN(200);
    const maxPrice = new BN(250);
    const resolveAt = new BN(Date.now() + ONE_DAY);
    const liquidityAmount = new BN(1000);

    const accounts = {
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

    const txHash = await pg.methods
      .createMarket(minPrice, maxPrice, resolveAt, liquidityAmount)
      .accounts(accounts)
      .signers([signer])
      .rpc()
      .catch((err) => { console.log(err); });

      console.log(`txHash: ${txHash}`);
      
    // Fetch updated accounts
    metadata = await pg.account.metadata.fetch(metadataPda);
    const market = await pg.account.market.fetch(marketPda);
    const programTokenAccount = await getAccount(connection, programTokenAccountPda);
    const liquidityProvided = programTokenAccount.amount.toString();
    
    console.log("market.minPrice:", market.minPrice.toString());
    console.log("market.maxPrice:", market.maxPrice.toString());
    console.log("market.resolveAt:", market.resolveAt.toString());
    console.log("market.isResolved:", market.isResolved);
    console.log("market.outcome:", market.outcome);
    console.log("liquidityProvided:", liquidityProvided);

    expect(metadata.marketCounter.toNumber()).to.equal(1);
    expect(market.minPrice.toNumber()).to.equal(minPrice.toNumber());
    expect(market.maxPrice.toNumber()).to.equal(maxPrice.toNumber());
    expect(market.resolveAt.toNumber()).to.equal(resolveAt.toNumber());
    expect(market.isResolved).to.equal(false);
    expect(market.outcome).to.equal(null);
    expect(liquidityProvided).to.equal(liquidityAmount.toString());
  });
});
