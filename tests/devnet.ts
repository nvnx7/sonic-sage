import {
  AnchorProvider,
  Program,
  setProvider,
  web3,
  workspace,
} from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  Account,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { SonicSage } from "../target/types/sonic_sage";
import { createToken, mintToken } from "./helpers";
import { Keypair } from "@solana/web3.js";

const setupTokens = async (provider: AnchorProvider) => {
  const connection = provider.connection;
  const signer = provider.wallet.payer;
  const pg = workspace.SonicSage as Program<SonicSage>;
  const programId = pg.programId;

  const airdropAddresses = [
    signer.publicKey,
    new PublicKey("WkiBodchP9vANGNicXevrjuz1CqfRDL48aH7Qric4Co"),
  ];

  const mint: PublicKey = await createToken({
    connection,
    owner: signer,
  });
  const signerTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    signer,
    mint,
    signer.publicKey
  );
  console.log("mint:", mint.toBase58());
  console.log("signerTokenAccount:", signerTokenAccount.address.toBase58());

  for (const address of airdropAddresses) {
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      signer,
      mint,
      address
    );

    await mintToken({
      connection,
      mint,
      signer,
      mintAuthority: signer.publicKey,
      tokenAccount,
      amount: 10000 * LAMPORTS_PER_SOL,
    });

    console.log("tokenAccount:", tokenAccount.address.toBase58());
  }

  return { mint, signerTokenAccount };
};

const setupMetadata = async (provider: AnchorProvider, mint: PublicKey) => {
  const pg = workspace.SonicSage as Program<SonicSage>;
  const connection = provider.connection;
  const signer = provider.wallet.payer;
  const [metadataPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("metadata")],
    pg.programId
  );
  const [programTokenAccountPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("token")],
    pg.programId
  );
  const accounts = {
    metadata: metadataPda,
    tokenAccount: programTokenAccountPda,
    mint,
    signer: signer.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: web3.SystemProgram.programId,
  };

  console.log("==========SETUP METADATA ACCOUNTS==========");
  Object.keys(accounts).map((k) => {
    console.log(k, accounts[k].toBase58());
  });

  const txHash = await pg.methods
    .setupMetadata()
    .accounts(accounts)
    .signers([signer])
    .rpc()
    .catch((err) => {
      console.log(err);
    });
  console.log(`setup:txHash: ${txHash}`);
  const metadataAcc = await pg.account.metadata.fetch(metadataPda);
  //   const programTokenAcc = await getOrCreateAssociatedTokenAccount(
  //     connection,
  //     signer,
  //     mint,
  //     programTokenAccountPda
  //   );
  console.log("metadataAcc:", metadataAcc.marketCounter.toString());
  //   console.log(
  //     "programTokenAccountAcc:",
  //     programTokenAcc.owner.toBase58(),
  //     programTokenAcc.amount.toString()
  //   );

  return { metadataPda, programTokenAccountPda };
};

describe.skip("Deploy", () => {
  const provider = AnchorProvider.env();
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

  it("deploy to devnet", async () => {
    const { mint, signerTokenAccount } = await setupTokens(provider);
    await setupMetadata(provider, mint);
  });
});
