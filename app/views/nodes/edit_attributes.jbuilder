@attrs.each do |key, val|
  val[:value] = @current_attributes[key]
  val[:type] = val[:type].to_s
  val.delete(:recipes)
end
json.merge! @attrs
