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

json.playbook_roles       @playbook_roles

json.runlist       @runlist
json.runlist_error       @runlist_error
json.selected_dish @selected_dish
json.dishes        @dishes
json.attribute_set @attribute_set

json.number_of_security_updates @number_of_security_updates
json.yum_schedule @yum_schedule
json.snapshot_schedules @snapshot_schedules

json.platform @platform
json.security_groups @security_groups

json.retention_policies @retention_policies
json.snapshots @snapshots

json.availability_zones @availability_zones

if @info
  json.info do
    json.cook_status       @info[:cook_status]
    json.ansible_status    @info[:ansible_status]
    json.servertest_status @info[:servertest_status] # TODO: Refactor all serverspec status
    json.update_status     @info[:update_status]
  end
else
  json.info({})
end
