#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Stack
  class CreationError < StandardError; end

  # Stack.new(infra)
  def initialize(infra)
    @infra             = infra
    @name              = infra.stack_name
    access_key_id     = infra.access_key
    secret_access_key = infra.secret_access_key
    region            = infra.region

    @cloud_formation = Aws::CloudFormation::Resource.new(
      access_key_id:     access_key_id,
      secret_access_key: secret_access_key,
      region:            region
    )
    @stack = @cloud_formation.stack(@name)

    self.update_status
  end

  attr_reader :name, :stack

  def inspect
    "#<#{self.class}: #{@name}>"
  end

  def create(template, parameters)
    @cloud_formation.create_stack(
      stack_name:    @name,
      template_body: template,
      parameters:    parameters,
      capabilities:  %w[CAPABILITY_IAM],
    )
  end

  def validate_template(template)
    @cloud_formation.client.validate_template(template_body: template)
  end

  def update(template, parameters)
    @stack.update(template_body: template, parameters: parameters)
  end

  # Stack を作成、すでにスタックが存在すればUpdate
  # 実行したアクションを返す
  def apply_template(template, parameters)
    action = nil
    begin
      action = 'Creating'
      self.create(template, parameters)
    rescue Aws::CloudFormation::Errors::AlreadyExistsException
      action = 'Updating'
      self.update(template, parameters)
    end
    update_status

    return action
  end

  def instances
    return resource_by_type("AWS::EC2::Instance")
  end

  def instances_for_resources
    return resource_by_type(
      "AWS::EC2::Instance", "AWS::RDS::DBInstance", "AWS::S3::Bucket", "AWS::ElasticLoadBalancing::LoadBalancer"
    )
  end

  # return: {available: (true|false), message: String, status: String(ex. CREATE_COMPLETE)}
  def status
    @status
  end

  def update_status
    begin
      @stack.reload
      status = @stack.stack_status
    rescue => ex
      @status = {available: false, message: ex.message, status: ""}
    else
      @status = {available: true, message: "", status: status}
    end
  end

  def delete
    @stack.delete
  end

  def in_progress?(st = status[:status])
    st.include?("_IN_PROGRESS")
  end

  def outputs
    @stack.outputs
  end

  %w{
    CREATE_IN_PROGRESS CREATE_FAILED CREATE_COMPLETE ROLLBACK_IN_PROGRESS ROLLBACK_FAILED ROLLBACK_COMPLETE
    DELETE_IN_PROGRESS DELETE_FAILED DELETE_COMPLETE UPDATE_IN_PROGRESS UPDATE_COMPLETE_CLEANUP_IN_PROGRESS
    UPDATE_COMPLETE UPDATE_ROLLBACK_IN_PROGRESS UPDATE_ROLLBACK_FAILED UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS
    UPDATE_ROLLBACK_COMPLETE
  }.each do |status_to_comp|
    define_method("#{status_to_comp.downcase}?") do |status = @status[:status]|
      status == status_to_comp
    end
  end

  FailedStatus = %w{
    CREATE_FAILED ROLLBACK_IN_PROGRESS ROLLBACK_FAILED ROLLBACK_COMPLETE DELETE_FAILED UPDATE_ROLLBACK_IN_PROGRESS
    UPDATE_ROLLBACK_FAILED UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS UPDATE_ROLLBACK_COMPLETE
  }.freeze

  CompleteStatus = %w{
    CREATE_COMPLETE UPDATE_COMPLETE DELETE_COMPLETE
  }.freeze

  def self.failed?(status)
    FailedStatus.include?(status)
  end

  def failed?(st = status[:status])
    FailedStatus.include?(st)
  end

  def self.complete?(status)
    CompleteStatus.include?(status)
  end

  def complete?(st = status[:status])
    CompleteStatus.include?(st)
  end

  def wait_status(status_to_wait, interval=10)
    until (current_status = status[:status]) == status_to_wait
      raise CreationError, "stack creation failed (#{current_status})" if failed?(current_status)
      sleep interval
      update_status
    end
  end

  # @param [String] logical_id is logical_resource_id. You defined in CloudFormation template.
  # @param [String] status_to_wait
  # @param [Integer] interval
  def wait_resource_status(logical_id, status_to_wait, interval=10)
    resource = @stack.resource(logical_id)
    loop do
      sleep interval
      begin
        resource.reload
        current_status = resource.resource_status
      rescue Aws::CloudFormation::Errors::ValidationError # => resource doesn't exist.
        next
      end

      break if current_status == status_to_wait
      raise CreationError, "stack creation failed (#{current_status})" if failed?(current_status)
    end
  end

  def events
    @stack.events.map do |event|
      {
        time:    event.timestamp,
        type:    event.resource_type,
        logical: event.logical_resource_id,
        status:  event.resource_status,
        reason:  event.resource_status_reason
      }
    end
  end

  def detach_chef
    return unless @status[:available]

    instances.each do |i|
      next if i.physical_resource_id.blank?

      Node.new(i.physical_resource_id).delete
    end
  end

  # CloudFormationの持つResourceをModelのインスタンスとして取得する。
  def get_resources
    aws_resources = instances_for_resources
    return aws_resources.map do |aws_resource|
      if aws_resource.resource_type == "AWS::EC2::Instance"
        physical_id = aws_resource.physical_resource_id
        tags = @infra.ec2.instances[physical_id].tags
        screen_name = tags['Name']
      end

      Resource.new(
        physical_id: aws_resource.physical_resource_id,
        type_name: aws_resource.resource_type,
        infrastructure_id: @infra.id,
        screen_name: screen_name
      )
    end
  end

  def status_and_type
    name = status[:status]
    type = if complete?
             'OK'
           elsif failed?
             'NG'
           elsif in_progress?
             'IN_PROGRESS'
           end

    unless status[:available]
      name = 'NO_STACK_INFO'
      type = 'NONE'
    end

    return {name: name, type: type}
  end


  private

  def resource_by_type(*types)
    return @stack.resource_summaries.select do |summary|
      types.include?(summary.resource_type)
    end
  end
end
