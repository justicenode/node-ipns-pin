const ipfsApi = require('ipfs-http-client')
const fs = require('fs')

const configFile = './config.json'

// Load config file
const cfg = require(configFile)

// Connect to ipfs node
const ipfs = new ipfsApi(cfg.ipfs)

// Helper function to update pins
const updatePin = (pin) => new Promise(async (resolve, reject) => {
    // Resolve ipns to cid
    let last = null
    for await (const name of ipfs.name.resolve(`/ipns/${pin.ipns}`)) {
      last = name
    }
    const cid = last.substr(6)

    // Check if pin has changed or was added
    if(!pin.current || pin.current != cid) {
        // Pin new cid
        await ipfs.pin.add(cid, {
            recursive: true,
        })

        // Unpin old cid if necessary
        if (pin.current) {
            await ipfs.pin.rm(pin.current)
        }

        resolve({...pin, current: cid})
    } else {
        //TODO: verify pin?
        resolve(pin)
    }
})

// If pins exist run them all through the previous helper
if (cfg.pins) {
    console.log('Updating pins...')
    Promise.all(cfg.pins.map(updatePin)).then(r => {
        console.log('Pins updated', r)
        // Merge updated pins with existing config
        const newCfg = {...cfg, pins: r}

        console.log('Writing config...')
        fs.writeFileSync(configFile, JSON.stringify(newCfg, null, '\t'))
        console.log('Done!')
    })
}
