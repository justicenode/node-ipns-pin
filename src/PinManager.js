const utils = require('./utils')

class PinManager {
	constructor(configFile, logger) {
		this.configFile = configFile
		this.logger = logger
	}

	init(ipfs = true) {
		if (!this.cfg)
			this.cfg = utils.readConfig(this.configFile)
		if (ipfs && !this.ipfs)
			this.ipfs = utils.loadIpfs(this.cfg)
	}

	writeConfig(cfg) {
		utils.writeConfig(this.configFile, cfg)
	}

	setIpfsApi({ipfsApi}) {
		this.init(false)
		this.writeConfig({...this.cfg, ipfs: ipfsApi})
	}

	listPins(argv) {
		this.init(false)
	  for (const pin of this.cfg.pins)
	  	console.log(argv.v ? `${pin.ipns} ${pin.current}` : pin.ipns)
	}

	addPin({ipns}) {
		this.init()
	  const add = this.cfg.pins.find(p => p.ipns == ipns)
	  if (add)
	    this.logger.error("pin already exists")
	  else {
			this.updatePin({ipns: ipns}).then(newPin => {
	  		this.writeConfig({...this.cfg, pins: [...this.cfg.pins, newPin]})
			}).catch(e => {
				this.logger.error("failed to pin")
			})
	  }
	}

	async rmPin({ipns}) {
		this.init()
		console.log(this.cfg, ipns)
    const rm = this.cfg.pins.find(p => p.ipns == ipns)
    if (rm) {
      if (rm.current)
        await this.ipfs.pin.rm(rm.current)
      this.writeConfig({...this.cfg, pins: this.cfg.pins.filter(p => p.ipns != ipns)})
    } else {
      this.logger.error("pin not found")
    }
	}

	updatePin(pin) {
		this.init()
		return new Promise(async (resolve, reject) => {
	    // Resolve ipns to cid
	    let last = null
	    for await (const name of this.ipfs.name.resolve(`/ipns/${pin.ipns}`)) {
	      last = name
	    }
	    const cid = last.substr(6).trim('/')

	    // Check if pin has changed or was added
	    if(!pin.current || pin.current != cid) {
	        // Pin new cid
	        this.ipfs.pin.add(cid, {
	            recursive: true,
	        }).then(() => {
						const newPin = {...pin, current: cid}
					  // Unpin old cid if necessary
		        if (pin.current) {
		            this.ipfs.pin.rm(pin.current).catch(e => {
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
	}
}

module.exports = PinManager
