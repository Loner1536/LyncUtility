-- Compiled with rotor v2.3.0
local TS = _G[script]
local serdes = TS.import(script, script, "codec").serdes
local collect = TS.import(script, script, "packet").collect
local _store = TS.import(script, script, "store")
local hydrate = _store.hydrate
local sync = _store.sync
local LyncUtility = {
	serdes = serdes,
	collect = collect,
	hydrate = hydrate,
	sync = sync,
}
local default = LyncUtility
return {
	serdes = serdes,
	collect = collect,
	hydrate = hydrate,
	sync = sync,
	default = default,
}
