const RPC_URL = 'localhost'
const KEYPAIR_PATH = '/tmp/keypair.json'
const PROGRAM_ID = new PublicKey([1, 2, 3])

import fs from 'mz/fs'
import {
   Connection,
   Keypair,
   Transaction,
   TransactionInstruction,
   sendAndConfirmTransaction,
   PublicKey
} from "@velas/web3"

async function loadKeypair(filePath: string): Promise<Keypair> {
   const secretKeyString = await fs.readFile(KEYPAIR_PATH, { encoding: 'utf8' })
   const secretKey = Uint8Array.from(JSON.parse(secretKeyString))
   return Keypair.fromSecretKey(secretKey)
}

async function main() {
   const connection = new Connection(RPC_URL, 'confirmed')

   const user = await loadKeypair(KEYPAIR_PATH);

   const instruction = new TransactionInstruction({
      keys: [
         { pubkey: user.publicKey, isSigner: true, isWritable: true }
      ],
      programId: PROGRAM_ID,
      data: Buffer.from([0x42]),
   })

   const tx = new Transaction().add(instruction)

   const result = await sendAndConfirmTransaction(connection, tx, [user])

   console.info("client has exited...")
}

main().then(
   () => process.exit(),
   err => {
      console.error(err)
      process.exit(-1)
   },
)
