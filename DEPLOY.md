# Deploying Flobrij Anchor Program to Devnet

References:

- [Deploying to devnet (lorisleiva.com)](https://lorisleiva.com/create-a-solana-dapp-from-scratch/deploying-to-devnet)
- [Deploying to devnet (learn.figment.io) (deploy script)](https://learn.figment.io/tutorials/build-a-blog-dapp-using-anchor#deploy-to-devnet)

## Deploying to devnet

### For first-time deploy:

- Create a local `/deploy` folder

Update `Anchor.toml`:

Make sure `[provider]' is updated. Seems to be needed -- wallet override didn't seem to be working.

```
[provider]
cluster = "devnet"
# wallet = "~/.config/solana/id.json"
wallet = "~/rust-programs/deploy/programauthority-keypair.json"
```

Run deploy:

    npm run deploy:devnet

### After deploy

At the end it copies the IDL to the front-end, you need to check this in and deploy the front-end.

    cp target/idl/${projectName}.json ../flobrij-frontend/src/idl.json

### Save the keys!

Make sure you save the following keypair files to a password safe:

- `./deploy/programauthority-keypair.json` and 12-word seeds for recovery
- `./target/deploy/flobrij-keypair.json`
