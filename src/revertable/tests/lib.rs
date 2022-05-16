use primitive_types::H160;
use solana_program_test::{BanksClient, ProgramTest, processor};
use solana_sdk::{
    account::Account,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    transaction::Transaction,
};

use revertable::program;

#[tokio::test]
async fn test_revert() {
    let program_id = Pubkey::new_unique();

    let mut program_test = ProgramTest::new(
        "revert-test",
        program_id,
        processor!(program),
    );

    let user = Keypair::new();
    let owner: Keypair = Keypair::new();

    program_test.add_account(
        user.pubkey(),
        Account {
            lamports: 33_000_000,
            ..Account::default() // data, owner
        }
    );

    program_test.add_account(
        owner.pubkey(),
        Account {
            lamports: 33_000_000,
            ..Account::default() // data, owner
        }
    );

    let (mut banks_client, _, recent_blockhash) = program_test.start().await;

    let accounts = vec![AccountMeta::new(user.pubkey(), true)];
    let mut transaction = Transaction::new_with_payer(
        &[Instruction::new_with_bincode(program_id, &[b"some data"], accounts)],
        Some(&user.pubkey()),
    );
    transaction.sign(&[&user], recent_blockhash);
    banks_client.process_transaction(transaction).await.unwrap();
}
