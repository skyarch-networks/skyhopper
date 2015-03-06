json.rds do
  json.db_instance_class @db_instance_class
  json.allocated_storage @allocated_storage
  json.endpoint_address  @endpoint_address
  json.multi_az          @multi_az
  json.engine            @engine
end
