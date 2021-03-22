const ipfsApi = require('ipfs-http-client')
const fs = require('fs')

const configFile = './config.json'
const argv = process.argv.slice(2)

let cfg = {
	ipfs: "http://localhost:5001/api/v0",
	pins: [],
}

// Load config file
try {
    cfg = {...cfg, ...(JSON.parse(fs.readFileSync(configFile, 'utf8')))}
} catch (e) {
    console.log("Warning: no config.json file found. using defaults")
}


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

const addPin = (ipns) => {
    const add = cfg.pins.find(p => p.ipns == ipns)
    if (add)
        console.log("Error: pin already exists")
    else {
        writeConfig({...cfg, pins: [...cfg.pins, {ipns: ipns}]})
    }
}

const rmPin = async (ipns) => {
    const rm = cfg.pins.find(p => p.ipns == ipns)
    if (rm) {
        if (rm.current)
            await ipfs.pin.rm(rm.current)
        writeConfig({...cfg, pins: cfg.pins.filter(p => p.ipns != ipns)})
    } else {
        console.log("Error: pin not found")
    }
}

const listPins = () => {
    for (const pin of cfg.pins) {
        console.log(`${pin.ipns} ${pin.current}`)
    }
}

const writeConfig = (cfg) => {
    console.log('Writing config...')
    fs.writeFileSync(configFile, JSON.stringify(cfg, null, '\t'))
    console.log('Done!')
}

const printHelp = () => {
    console.log("Usage:")
    console.log("ipns-pin update               - Updates pins")
    console.log("ipns-pin ls                   - lists all pins")
    console.log("ipns-pin add {nodeid/dnslink} - add new ipns pin")
    console.log("ipns-pin rm {nodeid/dnslink}  - remove a ipns pin")
    console.log("ipns-pin ipfs {api address}   - set which ipfs node to use")
}

// If pins exist run them all through the previous helper
if (argv.length == 1) {
    if (argv[0] == "update") {
        if (cfg.pins) {
            console.log('Updating pins...')
            Promise.all(cfg.pins.map(updatePin)).then(r => {
                console.log('Pins updated', r)
                // Merge updated pins with existing config
                const newCfg = {...cfg, pins: r}
                writeConfig(newCfg)
            })
        } else {
            console.log('error: no pins found in config.json')
        }
    }
   else if (argv[0] == "ls") {
        listPins()
   } else printHelp()
} else if (argv.length == 2) {
    if (argv[0] == "add") {
        addPin(argv[1])
    } else if (argv[0] == "rm") {
        rmPin(argv[1])
    } else if (argv[0] == 'ipfs') {
        writeConfig({...cfg, ipfs: argv[1]})
    } else printHelp()
} else printHelp()

