import dotenv from 'dotenv'
import fs from 'mz/fs'
import {
   Connection,
   Keypair,
   Transaction,
   TransactionInstruction,
   sendAndConfirmTransaction,
   PublicKey,
   SystemProgram,
} from "@velas/web3"

const EVM_PROGRAM_ID = new PublicKey('EVM1111111111111111111111111111111111111111')

async function loadKeypair(filePath: string): Promise<Keypair> {
   const secretKeyString = await fs.readFile(filePath, { encoding: 'utf8' })
   const secretKey = Uint8Array.from(JSON.parse(secretKeyString))
   return Keypair.fromSecretKey(secretKey)
}

function callRevertable(user: PublicKey, invokeProgramId: PublicKey, revertProgramId: PublicKey): Transaction {
   return new Transaction().add(
      new TransactionInstruction({
         keys: [
            { pubkey: revertProgramId, isSigner: false, isWritable: true },
            { pubkey: user, isSigner: true, isWritable: true }
         ],
         programId: invokeProgramId,
         data: Buffer.from([0x42]), // ether address
      })
   )
}

function assign(user: PublicKey): Transaction {
   return new Transaction().add(SystemProgram.assign({
      accountPubkey: user,
      programId: EVM_PROGRAM_ID
   }))
}

async function main() {
   dotenv.config()

   const RPC_URL = process.env.RPC_URL || ''
   const SIGNER_KEYPAIR = process.env.SIGNER_KEYPAIR || ''
   const REVERT_PROGRAM_ID = process.env.REVERT_PROGRAM_ID || ''
   const INVOKE_PROGRAM_ID = process.env.INVOKE_PROGRAM_ID || ''

   console.info(`RPC_URL=${RPC_URL}`)
   console.info(`SIGNER_KEYPAIR=${SIGNER_KEYPAIR}`)
   console.info(`REVERT_PROGRAM_ID=${REVERT_PROGRAM_ID}`)
   console.info(`INVOKE_PROGRAM_ID=${INVOKE_PROGRAM_ID}`)

   const connection = new Connection(RPC_URL, 'confirmed')
   const user = await loadKeypair(SIGNER_KEYPAIR);
   // user should have some tokens
   let userBalance = await connection.getBalance(user.publicKey);
   console.info(userBalance)
   const assign_tx = assign(user.publicKey)
   const call_tx = callRevertable(user.publicKey, new PublicKey(INVOKE_PROGRAM_ID), new PublicKey(REVERT_PROGRAM_ID))

   let result = await sendAndConfirmTransaction(connection, assign_tx, [user])
   result = await sendAndConfirmTransaction(connection, call_tx, [user])

   userBalance = await connection.getBalance(user.publicKey);
   console.info(userBalance)

   // TODO: check EVM address balance

   console.info("client has exited...")
}

main().then(
   () => process.exit(),
   err => {
      console.error(err)
      process.exit(-1)
   },
)
