-- Compiled with rotor v2.3.0
--* Buffers values received by a client packet until they are consumed. 
local function collect(packet)
	local values = {}
	local connection = packet:onClient(function(value)
		local _values = values
		local _value = value
		table.insert(_values, _value)
		return #_values
	end)
	return {
		iter = function()
			local collected = values
			values = {}
			return collected
		end,
		disconnect = function()
			connection:disconnect()
			values = {}
		end,
	}
end
return {
	collect = collect,
}
