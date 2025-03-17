import { expect } from "chai";
import {
  AnchorProvider,
  setProvider,
  workspace,
  BN,
  web3,
} from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  getOrCreateAssociatedTokenAccount,
  Account,
  TOKEN_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { SonicSage } from "../target/types/sonic_sage";
import { createToken, mintToken } from "./helpers";

describe.skip("setup", () => {
  const provider = AnchorProvider.local();
  setProvider(provider);
  const connection = provider.connection;
  const pg = workspace.SonicSage as Program<SonicSage>;
  const programId = pg.programId;
  const signerKp = provider.wallet.payer;
  const [metadataPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("metadata")],
    programId
  );
  const [tokenPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("token")],
    programId
  );
  let mint: PublicKey;
  let signerTokenAccount: Account;

  before(async () => {
    mint = await createToken({
      connection,
      owner: signerKp,
    });

    signerTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      signerKp,
      mint,
      signerKp.publicKey
    );
  });

  it("setup", async () => {
    await mintToken({
      connection,
      mint,
      signer: signerKp,
      mintAuthority: signerKp.publicKey,
      tokenAccount: signerTokenAccount,
      amount: 100 * LAMPORTS_PER_SOL,
    });

    console.log("mintAddress", mint.toBase58());
    console.log("signerTokenAccount", signerTokenAccount.address.toBase58());
    console.log("tokenPda", tokenPda.toBase58());

    const accounts = {
      metadata: metadataPda,
      tokenAccount: tokenPda,
      mint,
      signer: signerKp.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    };

    const txHash = await pg.methods
      .setupMetadata()
      .accounts(accounts)
      .signers([signerKp])
      .rpc()
      .catch((err) => {
        console.log(err);
      });
    console.log(`txHash: ${txHash}`);

    const metadata = await pg.account.metadata.fetch(metadataPda);
    const token = await getAccount(connection, tokenPda);
    console.log("metadata", metadata.marketCounter.toNumber());
    console.log(
      "token",
      token.address.toBase58(),
      token.amount.toString(),
      token.owner.toBase58()
    );

    expect(metadata.marketCounter.toNumber()).to.equal(0);
    expect(token.amount).to.equal(BigInt(0));
    expect(token.owner.equals(tokenPda)).to.be.true;
    expect(token.address.equals(tokenPda)).to.be.true;
  });
});
