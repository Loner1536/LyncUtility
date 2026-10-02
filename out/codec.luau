-- Compiled with rotor v2.3.0
local TS = _G[script]
local Lync = TS.import(script, TS.getModule(script, "@rbxts", "Lync"))
--* Adapts a Lync codec for use as a Replecs component serializer. 
local function serdes(codec, options)
	if options == nil then
		options = {}
	end
	local _binding = options
	local bytespan = _binding.bytespan
	if options.variants == false then
		return {
			bytespan = bytespan,
			serialize = function(value)
				local bytes, refs = Lync.encode(codec, value)
				if refs ~= nil then
					error("Lync codec encoded instances, but variants were disabled", 0)
				end
				return bytes
			end,
			deserialize = function(bytes)
				return Lync.decode(codec, bytes)
			end,
		}
	end
	return {
		bytespan = bytespan,
		includes_variants = true,
		serialize = function(value)
			return Lync.encode(codec, value)
		end,
		deserialize = function(bytes, refs)
			return Lync.decode(codec, bytes, refs)
		end,
	}
end
return {
	serdes = serdes,
}
