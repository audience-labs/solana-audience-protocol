# Deploying Flobrij Anchor Program to Devnet

References:

- Post giving an overview of deploying to devnet, from [lorisleiva.com](https://lorisleiva.com/create-a-solana-dapp-from-scratch/deploying-to-devnet)
- Post about automation and scripting of deploys, from [learn.figment.io](https://learn.figment.io/tutorials/build-a-blog-dapp-using-anchor#deploy-to-devnet)

## First-time deploy to Devnet

**If you are upgrading, see "Upgrading" below.**

- Create a local `/deploy` folder.
- Run `npm run devnet:generate-keypair`
- Airdrop some SOL for deployment via `npm run devnet:airdrop` -- make sure you run this enough times to get at least 5 SOL.
- Update `Anchor.toml` to make sure `[provider]' is updated. Seems to be needed -- wallet override didn't seem to be working:

```
[provider]
cluster = "devnet"
# wallet = "~/.config/solana/id.json"
wallet = "~/rust-programs/deploy/programauthority-keypair.json"
```

- Run deploy
  solana balance <key here> --url devnet # to find balance before
  npm run devnet:deploy
  solana balance <key here> --url devnet # to find balance after

### After deploy

- At the end it copies the IDL to the front-end, you need to check this in and deploy the front-end.

  cp target/idl/${projectName}.json ../flobrij-frontend/src/idl.json

### Save the keys!

- Make sure you save the following keypair files to a password safe:
  - `./deploy/programauthority-keypair.json` and 12-word seeds for recovery
  - `./target/deploy/flobrij-keypair.json`

## Upgrading

(coming soon)
