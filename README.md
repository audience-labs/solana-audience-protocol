# rust-programs

If you're new to Solana here is a tutorial for setting up the tools, creating your local keypair and building your first programs: https://lorisleiva.com/create-a-solana-dapp-from-scratch/what-are-we-building

## Local Setup

    yarn install

    # set to run locally
    solana config set --url localhost

Make sure you're in the root of the repo, then in one terminal window start up the local blockchain:

    solana-test-validator

In a second terminal window, build and deploy the contract via:

    anchor build
    # if you see a `missing xcrun` error on MacOS you need to run `xcode-select --install`

    solana airdrop 5    # if your wallet is empty
    anchor deploy

Copy IDL to front-end

    cp target/idl/flobrij.json ~/flobrij-frontend/src/idl.json

## Run Tests

    yarn install

## Run code formatter on tests

    yarn style

**Make sure you don't have solana-test-validator running before running tests**

    anchor test     # which runs validator and tests in one go
