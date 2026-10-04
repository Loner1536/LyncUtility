-- Compiled with rotor v2.3.0
local TS = _G[script]
local subscribe = TS.import(script, TS.getModule(script, "@rbxts", "charm").src).subscribe
local function copy(value)
	local _object = {}
	if value then
		for _k, _v in value do
			_object[_k] = _v
		end
	end
	return _object
end
local function copyMap(state)
	local result = {}
	for id, value in state do
		result[id] = value
	end
	return result
end
local function setValue(state, id, value)
	local updated = copyMap(state)
	local _id = id
	local _arg1 = copy(value)
	updated[_id] = _arg1
	return updated
end
local function removeValue(state, id)
	local updated = copyMap(state)
	local _id = id
	updated[_id] = nil
	return updated
end
--* Mirrors a Lync replicated set into a local Charm store. 
local function hydrate(container, setter)
	local update = function(id, value)
		return setter(function(state)
			return setValue(state, id, value)
		end)
	end
	container:onAdded(update)
	container:onChanged(update)
	container:onRemoved(function(id)
		return setter(function(state)
			return removeValue(state, id)
		end)
	end)
end
local function write(container, id, value)
	local record = copy(value)
	if container:get(id) == nil then
		container:add(id, record)
	else
		container:update(id, record)
	end
end
local function syncState(container, current, previous)
	for id, value in current do
		if previous[id] ~= value then
			write(container, id, value)
		end
	end
	for id in previous do
		if not (current[id] ~= nil) then
			container:remove(id)
		end
	end
end
--* Mirrors a server-owned Charm store into a Lync replicated set. 
local function sync(getter, container)
	return subscribe(getter, function(current, previous)
		return syncState(container, current, previous or {})
	end)
end
return {
	hydrate = hydrate,
	sync = sync,
}
