import dotenv from 'dotenv'
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
   const secretKeyString = await fs.readFile(filePath, { encoding: 'utf8' })
   const secretKey = Uint8Array.from(JSON.parse(secretKeyString))
   return Keypair.fromSecretKey(secretKey)
}

function callRevertable(user: PublicKey, programId: PublicKey): Transaction {
   return new Transaction().add(
      new TransactionInstruction({
         keys: [
            { pubkey: user, isSigner: true, isWritable: true }
         ],
         programId,
         data: Buffer.from([0x42]),
      })
   )
}

async function main() {
   dotenv.config()

   const RPC_URL = process.env.RPC_URL || ''
   const SIGNER_KEYPAIR = process.env.SIGNER_KEYPAIR || ''
   const PROGRAM_ID = process.env.PROGRAM_ID || ''

   console.info(`RPC_URL=${RPC_URL}`)
   console.info(`SIGNER_KEYPAIR=${SIGNER_KEYPAIR}`)
   console.info(`PROGRAM_ID=${PROGRAM_ID}`)

   const connection = new Connection(RPC_URL, 'confirmed')
   const user = await loadKeypair(SIGNER_KEYPAIR);
   const tx = callRevertable(user.publicKey, new PublicKey(PROGRAM_ID))
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
