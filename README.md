# ipns-pin

A small script that updates pins for ipns addresses. Should be set up as a cron job.

## Requirements
- a running ipfs node

## Usage

Note: *You'll probably want to set up a cron job for the update command*

|Command|Description
|---|---
|ipns-pin version|Prints current version
|ipns-pin update|Updates pins
|ipns-pin ls|lists all pins
|ipns-pin add {nodeid/dnslink}|add new ipns pin
|ipns-pin rm {nodeid/dnslink}|remove a ipns pin
|ipns-pin ipfs {api address}|set which ipfs node to use

**Examples:**
- `ipns-pin add ipfs.io`
- `ipns-pin add QmQH5NZmPByoGokbhTWduMxMCanewdZrt3PBK7xi3nAQJv`
- `ipns-pin ipfs http://localhost:5001/api/v0`


~~If I use this thing enough I'll probably add cli commands to add/remove pins.~~
Boredom also works
