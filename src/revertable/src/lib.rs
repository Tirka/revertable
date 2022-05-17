use solana_program::{
    account_info::{AccountInfo, next_account_info},
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    program_error::ProgramError,
    program::invoke,
    msg
};

// use solana_evm_loader_program::{transfer_native_to_evm_ixs};

// use primitive_types::H160;
// use solana_sdk::transaction::Transaction;

entrypoint!(program);

pub fn program(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let owner = Pubkey::new_from_array([7; 32]);
    let lamports = 10_000;
    // let ether_address = H160([4; 20]);

    let accs = accounts.iter().collect::<Vec<_>>();
    msg!("accs: {:?}", &accs);
    
    let root = next_account_info(&mut accounts.iter())?;

    // let instructions = transfer_native_to_evm_ixs(owner, lamports, ether_address);
    let instructions = vec![];

    for (idx, i) in instructions.iter().enumerate() {
        match invoke(&i, accounts) {
            Ok(_) => msg!("[{}] ✅ instruction executed successfully: {:?}", idx, &i),
            Err(program_error) => msg!("[{}] ❎ instruction executed with error: {}", idx, &program_error)
        }

    }

    Err(ProgramError::Custom(33))
}
