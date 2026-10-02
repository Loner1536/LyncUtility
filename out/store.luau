-- Compiled with rotor v2.3.0
local TS = _G[script]
local subscribe = TS.import(script, TS.getModule(script, "@rbxts", "charm").src).subscribe
local function isMap(state)
	local _state = state
	local _condition = type(_state) == "table"
	if _condition then
		_condition = state.has ~= nil
	end
	return _condition
end
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
	if not isMap(state) then
		local _object = table.clone(state)
		setmetatable(_object, nil)
		_object[tostring(id)] = copy(value)
		return _object
	end
	local updated = copyMap(state)
	local _id = id
	local _arg1 = copy(value)
	updated[_id] = _arg1
	return updated
end
local function removeValue(state, id)
	if not isMap(state) then
		local _object = table.clone(state)
		setmetatable(_object, nil)
		local updated = _object
		updated[tostring(id)] = nil
		return updated
	end
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
local function syncRecord(container, current, previous)
	for key, value in pairs(current) do
		if previous[key] ~= value then
			write(container, tonumber(key), value)
		end
	end
	for key in pairs(previous) do
		if current[key] == nil then
			container:remove(tonumber(key))
		end
	end
end
local function syncMap(container, current, previous)
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
		if isMap(current) then
			syncMap(container, current, if isMap(previous) then previous else {})
		else
			syncRecord(container, current, if not isMap(previous) and previous ~= nil then previous else {})
		end
	end)
end
return {
	hydrate = hydrate,
	sync = sync,
}
