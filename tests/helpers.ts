import { Program, web3 } from "@coral-xyz/anchor";
import {
  Account,
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { SonicSage } from "../target/types/sonic_sage";

export const createToken = async (args: {
  connection: Connection;
  owner: Keypair;
}) => {
  const mint = await createMint(
    args.connection,
    args.owner,
    args.owner.publicKey,
    args.owner.publicKey,
    9
  );

  return mint;
};

export const mintToken = async (args: {
  connection: Connection;
  mint: PublicKey;
  signer: Keypair;
  mintAuthority: PublicKey;
  tokenAccount: any;
  amount: number;
}) => {
  await mintTo(
    args.connection,
    args.signer,
    args.mint,
    args.tokenAccount.address,
    args.mintAuthority,
    args.amount
  );
};

export const setupProgram = async (args: {
  pg: Program<SonicSage>;
  signer: Keypair;
}) => {
  const { pg, signer } = args;
  const programId = pg.programId;
  const connection = pg.provider.connection;

  const [metadataPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("metadata")],
    programId
  );
  const [programTokenAccountPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("token")],
    programId
  );

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

  await mintToken({
    connection,
    mint,
    signer,
    mintAuthority: signer.publicKey,
    tokenAccount: signerTokenAccount,
    amount: 10000 * LAMPORTS_PER_SOL,
  });

  console.log("Setting up...");
  const accounts = {
    metadata: metadataPda,
    tokenAccount: programTokenAccountPda,
    mint,
    signer: signer.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: web3.SystemProgram.programId,
  };
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

  const programTokenAccount: Account = await getAccount(
    connection,
    programTokenAccountPda
  );

  return {
    mint,
    signerTokenAccount,
    programTokenAccount,
    metadataPda,
    programTokenAccountPda,
  };
};

export const logMarket = (market) => {
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
