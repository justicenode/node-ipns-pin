const fs = require('fs')
const ipfsApi = require('ipfs-http-client')

const readConfig = (configFile) => {
	let cfg = {
		ipfs: "http://localhost:5001/api/v0",
		pins: [],
	}

	// Load config file
	try {
	  cfg = {...cfg, ...(JSON.parse(fs.readFileSync(configFile, 'utf8')))}
	} catch (e) {
	    console.log("[INFO] no config.json file found. using defaults")
	}

	return cfg
}

const writeConfig = (configFile, cfg) => {
    console.log('Writing config...')
    fs.writeFileSync(configFile, JSON.stringify(cfg, null, '\t'))
    console.log('Done!')
}

const loadIpfs = (cfg) => {
	return new ipfsApi(cfg.ipfs)
}

const loadAll = (configFile) => {
	const cfg = readConfig(configFile)
	return {
		cfg,
		ipfs: loadIpfs(cfg),
	}
}

module.exports = {
	readConfig,
	writeConfig,
	loadIpfs,
	loadAll,
}
