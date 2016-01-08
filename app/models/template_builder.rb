#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class TemplateBuilder
  class ResourceAlreadyExist < StandardError; end
  class ParameterAlreadyExist < StandardError; end
  class OutputAlreadyExist < StandardError; end

  require_relative 'template_builder/resource'

  @@base_template = {
    AWSTemplateFormatVersion: "2010-09-09",
    Description: nil,
    Parameters: {
      KeyName: {
        Description: 'Name of an existing EC2 KeyPair to enable SSH access to the instance',
        Type: 'String',
      }
    },
    Mappings: {},
    Resources: {},
    Outputs: {},
  }.recursive_freeze

  @@ami_mappings = {
    HVM: {
      "us-east-1"      => { "AMI" => "ami-b66ed3de" },
      "us-west-1"      => { "AMI" => "ami-4b6f650e" },
      "us-west-2"      => { "AMI" => "ami-b5a7ea85" },
      "eu-west-1"      => { "AMI" => "ami-6e7bd919" },
      "sa-east-1"      => { "AMI" => "ami-8737829a" },
      "ap-southeast-1" => { "AMI" => "ami-ac5c7afe" },
      "ap-southeast-2" => { "AMI" => "ami-63f79559" },
      "ap-northeast-1" => { "AMI" => "ami-4985b048" },
    },
    PV: { # 古くて動かないかも
      "us-east-1"      => { "AMI" => "ami-35792c5c" },
      "us-west-1"      => { "AMI" => "ami-687b4f2d" },
      "us-west-2"      => { "AMI" => "ami-d03ea1e0" },
      "eu-west-1"      => { "AMI" => "ami-149f7863" },
      "sa-east-1"      => { "AMI" => "ami-9f6ec982" },
      "ap-southeast-1" => { "AMI" => "ami-14f2b946" },
      "ap-southeast-2" => { "AMI" => "ami-a148d59b" },
      "ap-northeast-1" => { "AMI" => "ami-3561fe34" },
    },
  }

  class << self
    def resources
      # subclasses is ActiveSupport method.
      # XXX: !!!When use Resource.subclasses, Rails autoload wrong!!!
      # TemplateBuilder::Resource.subclasses
      ['EC2::Instance', 'EC2::EIP', 'EC2::VPC', 'EC2::SecurityGroup', 'RDS::DBInstance', 'S3::Bucket']
    end

    def resource(name)
      TemplateBuilder::Resource.const_get(name, false)
    end
  end

  def initialize
    @resources = []
    @parameters = []
    @outputs = []
  end

  def add(resource)
    raise ArgumentError, "#{resource} isn't resource" unless resource.kind_of? TemplateBuilder::Resource

    names = @resources.map{|x|x.name}
    raise ResourceAlreadyExist, "#{resource.name} already exist" if names.include?(resource.name)

    @resources << resource
  end

  def add_param(param)
    raise ArgumentError, "#{param} isn't parameter" unless param.kind_of? TemplateBuilder::Parameter

    param_names = @parameters.map{|p| p.name}
    raise ParameterAlreadyExist, "#{param.name} already exist" if param_names.include?(param.name)

    @parameters << param
  end

  def add_output(output)
    raise ArgumentError, "#{output} isn't output" unless output.kind_of? TemplateBuilder::Output

    output_names = @outputs.map{|out| out.name}
    raise OutputAlreadyExist, "#{output.name} already exist" if output_names.include?(output.name)

    @outputs << output
  end

  def build
    result = Marshal.load(Marshal.dump(@@base_template))

    # set Mappings AMI id
    # TODO: 効率悪そう
    ec2s = @resources.select{|r| r.kind_of? TemplateBuilder::Resource::EC2::Instance}
    have_hvm = ec2s.any?{|ec2| ec2.virtual_type == :HVM}
    have_pv  = ec2s.any?{|ec2| ec2.virtual_type == :PV}

    if have_hvm
      result[:Mappings].merge!(RegionMapHVM: @@ami_mappings[:HVM])
    end
    if have_pv
      result[:Mappings].merge!(RegionMapPV:  @@ami_mappings[:PV])
    end

    # set Description
    result[:Description] = @resources.map{|r| r.resource_type}.sort.inject(Hash.new(0)){|x, y| x[y] += 1;x}.map{|key, val| "#{key} x #{val}"}.join(', ')

    # set Resources
    @resources.each do |resource|
      builded_resource = resource.build
      result[:Resources].merge!(builded_resource)
    end

    # set Parameters
    @parameters.each do |param|
      builded_params = param.build
      result[:Parameters].merge!(builded_params)
    end

    @outputs.each do |output|
      builded_output = output.build
      result[:Outputs].merge!(builded_output)
    end

    return result
  end

  # rubocop:disable Rails/Delegate
  def to_json
    build.to_json
  end
  # rubocop:enable Rails/Delegate

  def to_pretty_json
    JSON::pretty_generate(build)
  end
end
