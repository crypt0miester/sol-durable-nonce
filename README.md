# Solana Durable Nonce

Create, set, and get durable nonce on Solana Network

This package is an advanced solana solution to solve the congestion, the package can be used in browsers and localy. this solution hopefully can fix transactions not landing.

use at your own discretion. you must store the durable nonce account or else it will be gone unless you can read explorers.

## How to use in a UI

```tsx
"use client"
import React, { useEffect, useState } from "react";

import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { getDurableNonce, setDurableNonce, createNonceTransaction, getNonceAccount } from "sol-durable-nonce";
import Loading from "@/components/Loading";
import { useConnection } from "@contexts/ConnectionContextProvider";

export function Widget() {
  const connection = useConnection();
  const { publicKey, sendTransaction } = useWallet()
  const [nonceExists, setNonceExists] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const checkNonceExists = async () => {
    if (publicKey) {
      const nonceAccount = getDurableNonce(publicKey.toString())
      if (!nonceAccount) {
        setNonceExists(false)
      } else {
        setNonceExists(true)
      }
    }
  }

  useEffect(() => {
    checkNonceExists()
  }, [publicKey])

  const createNonceTransactionAndConfirm = async () => {
    if (!sendTransaction) return
    if (!publicKey) return
    if (isLoading) return
    setIsLoading(true)
    const { transaction, noncePubkey } = await createNonceTransaction({
      connection,
      userPubkey: publicKey,
    })
    const transactionSignature = await sendTransaction(transaction, connection)
    await connection.confirmTransaction(transactionSignature, "processed")
    setDurableNonce(publicKey.toString(), noncePubkey.toString())
    setNonceExists(true)
    setIsLoading(false)
  }

  const generateTransaction = async () => {
    if (!sendTransaction) return
    if (isLoading) return
    setIsLoading(true)
    if (publicKey) {
      try {
        const nonceAccount = getDurableNonce(publicKey.toString())
        if (!nonceAccount) {
          throw Error("Expected nonceAccount to exist")
        }
        const nonceAccountData = await getNonceAccount({
          connection,
          nonceAccount,
        })
        if (!nonceAccountData) {
          throw Error("Expected nonceAccountData to exist")
        }
        // create any transaction
        // const transaction = new Transaction()

        // add nonceAdvanceIx to the transaction.
        // const noncifiedTransaction = noncifyTransaction({transaction, nonceAccountData, nonceAccount})

        // send the transaction
        // const transactionSignature = await sendTransaction(
        //   noncifiedTransaction,
        //   connection
        // )
        // await connection.confirmTransaction(transactionSignature, "processed")
      } catch (e: any) {
        console.log(e.message)
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto w-[30%]">
      {nonceExists ? (
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
          onClick={() => generateTransaction()}
        >
          {isLoading ? <Loading /> : "Run Transaction"}
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
          onClick={() => createNonceTransactionAndConfirm()}
        >
          {isLoading ? <Loading /> : "Initialize Nonce"}
        </Button>
      )}
    </div>
  )
```

## How to use locally
```ts
import {
  getDurableNonce,
  setDurableNonce,
  createNonceTransaction,
  getNonceAccount,
  noncifyTransaction,
} from "sol-durable-nonce";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import base58 from "bs58";

const connection = new Connection(
  "",
  {
    commitment: "confirmed",
  }
);

const payerKeypair = Keypair.fromSecretKey(
  base58.decode(
    ""
  )
);
const destination = new PublicKey(
  ""
);

const checkNonceExists = async () => {
  const nonceAccount = getDurableNonce(payerKeypair.publicKey.toString());
  return nonceAccount;
};

const createNonceTransactionAndConfirm = async () => {
  const { transaction, noncePubkey } = await createNonceTransaction({
    connection,
    userPubkey: payerKeypair.publicKey,
  });
  console.debug("Creating durable nonce:", noncePubkey.toString());
  transaction.partialSign(payerKeypair);
  const transactionSignature = await connection.sendRawTransaction(
    transaction.serialize()
  );
  await connection.confirmTransaction(transactionSignature, "processed");
  setDurableNonce(payerKeypair.publicKey.toString(), noncePubkey.toString());
};

const generateTransaction = async () => {
  try {
    const nonceAccount = getDurableNonce(payerKeypair.publicKey.toString());
    if (!nonceAccount) {
      throw Error("Expected nonceAccount to exist");
    }
    const nonceAccountData = await getNonceAccount({
      connection,
      nonceAccount,
    });
    if (!nonceAccountData) {
      throw Error("Expected nonceAccountData to exist");
    }

    // run any transaction
    const transferIx = SystemProgram.transfer({
      fromPubkey: payerKeypair.publicKey,
      toPubkey: destination,
      lamports: 0.01 * LAMPORTS_PER_SOL,
    });

    const transaction = new Transaction().add(transferIx);
    const noncifiedTransaction = noncifyTransaction({
      transaction,
      nonceAccountData,
      nonceAccount,
    });

    const transactionSignature = await connection.sendTransaction(
      noncifiedTransaction,
      [payerKeypair]
    );

    await connection.confirmTransaction(transactionSignature, "processed");
  } catch (e: any) {
    console.log(e.message);
  }
};

async function main() {
  const nonceAccount = await checkNonceExists();

  if (!nonceAccount) {
    await createNonceTransactionAndConfirm();
  } else {
    console.debug("Found nonceAccount:", nonceAccount.toString());
  }
  await generateTransaction();
}

main();
```