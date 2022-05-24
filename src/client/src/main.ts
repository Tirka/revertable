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
const EVM_STATE_PROGRAM_ID = new PublicKey('EvmState11111111111111111111111111111111111')

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
            { pubkey: user, isSigner: true, isWritable: true },
            { pubkey: EVM_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: EVM_STATE_PROGRAM_ID, isSigner: false, isWritable: true },
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

   const signer = await loadKeypair(SIGNER_KEYPAIR);

   let user = Keypair.generate()
   let send_tx = SystemProgram.transfer({
      fromPubkey: signer.publicKey,
      toPubkey: user.publicKey,
      lamports: 120000
   })

   let signature

   signature = await sendAndConfirmTransaction(connection, new Transaction().add(send_tx), [signer])
   let userBalance1 = await connection.getBalance(user.publicKey)
   console.info(`SOL balance before operation: ${userBalance1}`)
   const assign_tx = assign(user.publicKey)
   const call_tx = callRevertable(user.publicKey, new PublicKey(INVOKE_PROGRAM_ID), new PublicKey(REVERT_PROGRAM_ID))
   console.log(111)
   call_tx.feePayer = signer.publicKey
   assign_tx.feePayer = signer.publicKey

   signature = await sendAndConfirmTransaction(connection, assign_tx, [signer, user])
   console.log(222)
   signature = await sendAndConfirmTransaction(connection, call_tx, [signer, user])
   console.log(333)

   let userBalance2 = await connection.getBalance(user.publicKey)
   console.info(`SOL balance after operation: ${userBalance2}`)

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
