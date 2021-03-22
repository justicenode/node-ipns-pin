# node-ipns-pin

A small script that updates pins for ipns addresses. Should be set up as a cron job.

## Requirements
- basic knowledge of the cli
- know how to read `json`
- `npm`/`yarn`
- a running ipfs node

## Instructions

### First time
- run `npm install` or `yarn` to install dependencies
- copy `config.example.json` to `config.json`

### General
`node index.js`

### Configuration
Configuration is done through the `config.json` file.
To change or set which ipfs node edit the `ipfs` value in the json file.
Valid formats are described [here](https://github.com/ipfs/js-ipfs/tree/master/packages/ipfs-http-client#ipfshttpclientoptions).

**Add Pins:**
To add new ipns pins add them to the pins list like this:
```json
{
  "ipns": "full.domain.example"
}
```
*instead of a domain name you can also use a peer id*

**Remove pins:** To remove a pin just remove the entry from the list.
If you want the current version unpinned to youre goind to have to manually unpin the cid from the json file.
`ipfs pin rm {QmHash/bafyHash}`

*If I use this thing enough I'll probably add cli commands to add/remove pins.*