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
  		utils.writeConfig(configFile, {...cfg, pins: [...cfg.pins, newPin]})
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
        utils.writeConfig(configFile, {...cfg, pins: cfg.pins.filter(p => p.ipns != ipns)})
    } else {
        console.log("Error: pin not found")
    }
}

const listPins = (argv) => {
	const cfg = utils.readConfig(configFile)
  for (const pin of cfg.pins)
  	console.log(argv.v ? `${pin.ipns} ${pin.current}` : pin.ipns)
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

const ipnsBuilder = (yargs) =>  yargs.positional('ipns', {
  describe: 'Ipns to pin. Can be domain name or node id.',
  type: 'string',
})

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
		builder: (yargs) => yargs.option('v', {
			alias: 'verbose',
			describe: 'also prints the associated hash',
			type: 'boolean',
		}),
		handler: listPins,
	})
	.command({
		command: 'add <ipns>',
		builder: ipnsBuilder,
		desc: 'adds new ipns pin',
		handler: addPin,
	})
	.command({
		command: 'remove <ipns>',
		aliases: ['rm'],
		builder: ipnsBuilder,
		desc: 'removes a ipns pin',
		handler: rmPin,
	})
	.command({
		command: 'ipfs <ipfsApi>',
		desc: 'set which ipfs node to use',
		builder: (yargs) =>  yargs.positional('ipfsApi', {
		  describe: 'ipfs api url. see https://www.npmjs.com/package/ipfs-http-client#ipfshttpclientoptions',
		  type: 'string',
		}),
		handler: setIpfsApi,
	})
	.demandCommand()
	.help()
	.argv
