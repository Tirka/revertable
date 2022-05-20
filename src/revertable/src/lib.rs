use primitive_types::{H160, H256, U256};
use serde::{Deserialize, Serialize};
use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    instruction::AccountMeta,
    instruction::Instruction,
    msg,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction
};
use std::str::FromStr;

fn evm_state_id() -> Pubkey {
    Pubkey::from_str("EvmState11111111111111111111111111111111111").unwrap()
}

fn evm_id() -> Pubkey {
    Pubkey::from_str("EVM1111111111111111111111111111111111111111").unwrap()
}

entrypoint!(program);

pub fn program(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let lamports = 10_000;

    let ether_address = if instruction_data.len() == 20 {
        H160::from_slice(&instruction_data[0..20])
    } else {
        msg!("warn: ether_address set to default");
        H160::default()
    };

    if accounts.is_empty() {
        return Err(ProgramError::NotEnoughAccountKeys)
    }

    let owner = &accounts[0];

    let instructions = transfer_native_to_evm_ixs(*owner.key, lamports, ether_address);

    for (idx, i) in instructions.iter().enumerate() {
        match invoke(&i, accounts) {
            Ok(_) => msg!("[{}] ✅ instruction executed successfully: {:?}", idx, &i),
            Err(program_error) => msg!(
                "[{}] ❎ instruction executed with error: {}",
                idx,
                &program_error
            ),
        }
    }

    Err(ProgramError::Custom(33))
}

fn transfer_native_to_evm_ixs(
    owner: Pubkey,
    lamports: u64,
    ether_address: H160,
) -> Vec<Instruction> {
    vec![
        system_instruction::assign(&owner, &evm_id()),
        transfer_native_to_evm(owner, lamports, ether_address),
        free_ownership(owner),
    ]
}

fn free_ownership(owner: Pubkey) -> Instruction {
    let account_metas = vec![
        AccountMeta::new(evm_state_id(), false),
        AccountMeta::new(owner, true),
    ];

    Instruction::new_with_bincode(evm_id(), &EvmInstruction::FreeOwnership {}, account_metas)
}

fn transfer_native_to_evm(owner: Pubkey, lamports: u64, evm_address: H160) -> Instruction {
    let account_metas = vec![
        AccountMeta::new(evm_state_id(), false),
        AccountMeta::new(owner, true),
    ];

    Instruction::new_with_bincode(
        Pubkey::default(),
        &EvmInstruction::SwapNativeToEther {
            lamports,
            evm_address,
        },
        account_metas,
    )
}

#[derive(Debug, PartialEq, Eq, Ord, PartialOrd, Serialize, Deserialize)]
enum EvmBigTransaction {
    EvmTransactionAllocate { size: u64 },
    EvmTransactionWrite { offset: u64, data: Vec<u8> },
    EvmTransactionExecute {},
    EvmTransactionExecuteUnsigned { from: H160 },
}

#[derive(Debug, PartialEq, Eq, Ord, PartialOrd, Serialize, Deserialize)]
enum EvmInstruction {
    EvmTransaction {
        evm_tx: Transaction,
    },
    SwapNativeToEther {
        lamports: u64,
        evm_address: H160,
    },
    FreeOwnership {},
    EvmBigTransaction(EvmBigTransaction),
    EvmAuthorizedTransaction {
        from: H160,
        unsigned_tx: UnsignedTransaction,
    },
}

#[derive(Clone, Debug, Eq, PartialEq, Ord, PartialOrd, Serialize, Deserialize)]
struct Transaction {
    pub nonce: U256,
    pub gas_price: U256,
    pub gas_limit: U256,
    pub action: TransactionAction,
    pub value: U256,
    pub signature: TransactionSignature,
    pub input: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
struct UnsignedTransaction {
    pub nonce: U256,
    pub gas_price: U256,
    pub gas_limit: U256,
    pub action: TransactionAction,
    pub value: U256,
    pub input: Vec<u8>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, Ord, PartialOrd, Serialize, Deserialize)]
enum TransactionAction {
    Call(H160),
    Create,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, Ord, PartialOrd, Serialize, Deserialize)]
struct TransactionSignature {
    pub v: u64,
    pub r: H256,
    pub s: H256,
}
