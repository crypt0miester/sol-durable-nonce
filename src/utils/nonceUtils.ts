import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  NONCE_ACCOUNT_LENGTH,
  NonceAccount,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

export const createNonceTransaction = async ({
  connection,
  userPubkey,
}: {
  connection: Connection;
  userPubkey: PublicKey;
}) => {
  const nonceKeypair = Keypair.generate();
  const minimumRentNonce = 0.00144768;
  const tx = new Transaction();
  
  tx.feePayer = userPubkey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const computeFeesIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 500_000,
  });

  tx.add(
    computeFeesIx,
    SystemProgram.createAccount({
      fromPubkey: userPubkey,
      newAccountPubkey: nonceKeypair.publicKey,
      lamports: minimumRentNonce * LAMPORTS_PER_SOL,
      space: NONCE_ACCOUNT_LENGTH,
      programId: SystemProgram.programId,
    }),
    SystemProgram.nonceInitialize({
      noncePubkey: nonceKeypair.publicKey,
      authorizedPubkey: userPubkey,
    })
  );
  tx.partialSign(nonceKeypair);
  return { transaction: tx, noncePubkey: nonceKeypair.publicKey };
};

export const getNonceAccount = async ({
  connection,
  nonceAccount,
}: {
  connection: Connection;
  nonceAccount: PublicKey | string;
}) => {
  if (typeof nonceAccount == "string") {
    nonceAccount = new PublicKey(nonceAccount);
  }

  const accountInfo = await connection.getAccountInfo(nonceAccount);
  if (!accountInfo) return;

  const nonceAccountData = NonceAccount.fromAccountData(accountInfo.data);
  return nonceAccountData;
};

export const noncifyTransaction = ({
  transaction,
  nonceAccountData,
  nonceAccount,
}: {
  transaction: Transaction;
  nonceAccountData: NonceAccount;
  nonceAccount: PublicKey | string;
}) => {
  if (typeof nonceAccount == "string") {
    nonceAccount = new PublicKey(nonceAccount);
  }

  // make a nonce advance instruction
  const advanceIX = SystemProgram.nonceAdvance({
    authorizedPubkey: nonceAccountData.authorizedPubkey,
    noncePubkey: nonceAccount,
  });

  const instructions = [advanceIX, ...transaction.instructions];
  transaction.instructions = instructions;
  // use the nonceAccount's stored nonce as the recentBlockhash
  transaction.recentBlockhash = nonceAccountData.nonce;

  return transaction;
};
