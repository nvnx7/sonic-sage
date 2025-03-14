import { Program, web3 } from "@coral-xyz/anchor";
import { Account, createMint, getAccount, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import { SonicSage } from "../target/types/sonic_sage";

export const createToken = async (args: {connection: Connection, owner: Keypair}) => {
    const mint = await createMint(
        args.connection,
        args.owner,
        args.owner.publicKey,
        args.owner.publicKey,
        9
    );

    return mint;
}

export const mintToken = async (args: {connection: Connection, mint: PublicKey, signer: Keypair, mintAuthority: PublicKey, tokenAccount: any, amount: number}) => { 
    await mintTo(
        args.connection,
        args.signer,
        args.mint,
        args.tokenAccount.address,
        args.mintAuthority,
        args.amount
    )
}

export const setupProgram = async (args: {pg: Program<SonicSage>, signer: Keypair}) => { 
    const {pg, signer} = args;
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
        amount: 100 * LAMPORTS_PER_SOL
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
    
    const txHash = await pg.methods
    // .setupMetadata(mint.toBase58())
    .setupMetadata()
    .accounts(accounts)
    .signers([signer])
    .rpc()
    .catch((err) => {
      console.log(err);
    });
    console.log(`setup:txHash: ${txHash}`);

    const programTokenAccount: Account = await getAccount(connection, programTokenAccountPda);

    console.log('signerTokenAccount', signerTokenAccount?.address.toBase58());
    console.log('programTokenAccountPda', programTokenAccountPda.toBase58());
    console.log('programTokenAccount', programTokenAccount?.address.toBase58());
    console.log('mint', mint.toBase58());
    console.log("signerTokenAcc.mint", signerTokenAccount?.mint.toBase58());
    console.log('programTokenAcc.mint', programTokenAccount?.mint.toBase58());
    
    return {mint, signerTokenAccount, programTokenAccount, metadataPda, programTokenAccountPda};
}