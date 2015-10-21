json.public_ip     @instance_summary[:public_ip]
json.status        @instance_summary[:status]
json.instance_type @instance_summary[:instance_type]
json.public_dns    @instance_summary[:public_dns]
json.elastic_ip    @instance_summary[:elastic_ip].to_s
json.block_devices @instance_summary[:block_devices].to_a
json.root_device_name @instance_summary[:root_device_name]
json.availability_zone @instance_summary[:availability_zone]

json.chef_error @chef_error
json.chef_msg   @chef_msg
json.before_bootstrap @before_bootstrap

json.runlist       @runlist
json.selected_dish @selected_dish
json.dishes        @dishes
json.attribute_set @attribute_set

json.number_of_security_updates @number_of_security_updates
json.yum_schedule  @yum_schedule
json.snapshot_schedules @snapshot_schedules

if @info
  json.info do
    json.cook_status       @info[:cook_status]
    json.serverspec_status @info[:serverspec_status]
    json.update_status     @info[:update_status]
  end
else
  json.info({})
end
