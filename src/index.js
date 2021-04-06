const yargs = require('yargs/yargs')
const utils = require('./utils')

const configFile = process.env.CONFIG_FILE || './config.json'
const version = '1.2.0'
const argv = process.argv.slice(2)

// Helper function to update pins
const updatePin = (pin) => new Promise(async (resolve, reject) => {
    // Resolve ipns to cid
    let last = null
    for await (const name of ipfs.name.resolve(`/ipns/${pin.ipns}`)) {
      last = name
    }
    const cid = last.substr(6).trim('/')

    // Check if pin has changed or was added
    if(!pin.current || pin.current != cid) {
        // Pin new cid
        ipfs.pin.add(cid, {
            recursive: true,
        }).then(() => {
					const newPin = {...pin, current: cid}
				  // Unpin old cid if necessary
	        if (pin.current) {
	            ipfs.pin.rm(pin.current).catch(e => {
								console.log('[WARNING] failed to remove old pin')
							}).finally(() => {
								resolve(newPin)
							})
	        } else {
						resolve(newPin)
					}
				}).catch(e => {
					console.log("[ERROR] failed to update pin: ", e)
					resolve(pin)
				})
    } else {
        //TODO: verify pin! Currently not implemented in js-ipfs
        resolve(pin)
    }
})

const addPin = ({ipns}) => {
	const {cfg, ipfs} = utils.loadAll(configFile)
  const add = cfg.pins.find(p => p.ipns == ipns)
  if (add)
    console.log("Error: pin already exists")
  else {
		updatePin({ipns: ipns}).then(newPin => {
  		writeConfig({...cfg, pins: [...cfg.pins, newPin]})
		}).catch(e => {
			console.log("Error: failed to pin")
		})
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

const printUpdated = (old, current) => {
	for (const pin of old) {
		const newPin = current.find(a => a.ipns == pin.ipns)
		if (newPin.current != pin.current) {
			console.log(`[${pin.ipns}] ${pin.current} -> ${newPin.current}`)
		}
	}
}

const updatePins = () => {
	const {cfg, ipfs} = utils.loadAll(configFile)
	if (cfg.pins) {
			console.log('Updating pins...')
			Promise.all(cfg.pins.map(updatePin)).then(r => {
					console.log('Pins updated!')
					printUpdated(cfg.pins, r)

					// Merge updated pins with existing config
					const newCfg = {...cfg, pins: r}
					utils.writeConfig(configFile, newCfg)
			})
	} else {
			console.log('error: no pins found in config.json')
	}
}

const setIpfsApi = ({ipfsApi}) => {
	const cfg = utils.readConfig(configFile)
	utils.writeConfig(configFile, {...cfg, ipfs: ipfsApi})
}

yargs(process.argv.slice(2))
	.version(version)
	.command({
		command: 'update',
		aliases: ['refresh', 'u'],
		desc: 'updates pins',
		handler: updatePins,
	})
	.command({
		command: 'list',
		aliases: ['ls'],
		desc: 'lists all pins',
		handler: listPins,
	})
	.command({
		command: 'add <ipns>',
		desc: 'adds new ipns pin',
		handler: addPin,
	})
	.command({
		command: 'remove <ipns>',
		aliases: ['rm'],
		desc: 'removes a ipns pin',
		handler: rmPin,
	})
	.command({
		command: 'ipfs <ipfsApi>',
		desc: 'set which ipfs node to use',
		handler: setIpfsApi,
	})
	.demandCommand()
	.help()
	.argv
