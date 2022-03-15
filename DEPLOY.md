# Deploying Flobrij Anchor Program to Devnet

References:

- Post giving an overview of deploying to devnet, from [lorisleiva.com](https://lorisleiva.com/create-a-solana-dapp-from-scratch/deploying-to-devnet)
- Post about automation and scripting of deploys, from [learn.figment.io](https://learn.figment.io/tutorials/build-a-blog-dapp-using-anchor#deploy-to-devnet)

## First-time deploy to Devnet

**If you are upgrading, see "Upgrading" below.**

- Make sure you have around 4 SOL to deploy.
- Create a local `/deploy` folder.
- Run `yarn devnet:generate-keypair`
- Airdrop for atleast 4 SOL for deployment via `yarn devnet:airdrop` -- run twice to get 4 SOL
- Update `Anchor.toml` to make sure `[provider]' is updated. Seems to be needed -- wallet override didn't seem to be working:

```
[provider]
cluster = "devnet"
# wallet = "~/.config/solana/id.json"
wallet = "~/rust-programs/deploy/programauthority-keypair.json"
```

- Run deploy
  solana balance <key here> --url devnet # to find balance before
  yarn devnet:deploy
  solana balance <key here> --url devnet # to find balance after

### After deploy

- At the end it copies the IDL to the front-end, you need to check this in and deploy the front-end.

  cp target/idl/${projectName}.json ../flobrij-frontend/src/idl.json

### Save the keys!

- Make sure you save the following keypair files to a password safe:
  - `./deploy/programauthority-keypair.json` and 12-word seeds for recovery
  - `./target/deploy/flobrij-keypair.json`

## Upgrading

Upgrading is much cheaper than initial deploy. It's about 0.001 SOL.

Same setup as "First-time Deploy" except run:

  solana balance <key here> --url devnet # to find balance before
  yarn devnet:upgrade
  solana balance <key here> --url devnet # to find balance after
