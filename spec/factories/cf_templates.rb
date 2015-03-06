#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

FactoryGirl.define do
  factory :cf_template do
    infrastructure
    name 'EC2x1'
    detail 'Ec2 ga hitotsu no template.'
    value <<-EOS
{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "Simple Pattern (EC2x1)",
    "Parameters": {
        "KeyName": {
            "Description": "Name of an existing EC2 KeyPair to enable SSH access to the instance",
            "Type": "String"
        },
        "InstanceType": {
            "Description": "EC2 Instance Type",
            "Type": "String",
            "Default": "t1.micro",
            "AllowedValues": [
                "t1.micro",
                "m1.small",
                "m1.medium",
                "m1.large",
                "m1.xlarge",
                "m2.xlarge",
                "m2.2xlarge",
                "m2.4xlarge",
                "m3.medium",
                "m3.large",
                "m3.xlarge",
                "m3.2xlarge",
                "c1.medium",
                "c1.xlarge",
                "c3.large",
                "c3.xlarge",
                "c3.2xlarge",
                "c3.4xlarge",
                "c3.8xlarge",
                "cc1.4xlarge",
                "cc2.8xlarge",
                "cg1.4xlarge"
            ],
            "ConstraintDescription": "must be a valid EC2 instance type."
        },
        "BlockDeviceVolumeSize": {
            "Description": "Root volume size",
            "Type": "String",
            "Default": "8"
        },
        "BlockDeviceVolumeType": {
            "Description": "Root volume type. gp2 for General Purpose (SSD) volumes, standard for Magnetic volumes.",
            "Type": "String",
            "Default": "standard",
            "AllowedValues": [
                "gp2",
                "standard"
            ]
        }
    },
    "Mappings": {
        "RegionMap": {
            "us-east-1": {
                "AMI": "ami-35792c5c",
                "AvailabilityZone": "us-east-1a"
            },
            "us-west-1": {
                "AMI": "ami-687b4f2d",
                "AvailabilityZone": "us-west-1a"
            },
            "us-west-2": {
                "AMI": "ami-d03ea1e0",
                "AvailabilityZone": "us-west-2a"
            },
            "eu-west-1": {
                "AMI": "ami-149f7863",
                "AvailabilityZone": "eu-west-1a"
            },
            "sa-east-1": {
                "AMI": "ami-9f6ec982",
                "AvailabilityZone": "sa-east-1a"
            },
            "ap-southeast-1": {
                "AMI": "ami-14f2b946",
                "AvailabilityZone": "ap-southeast-1a"
            },
            "ap-southeast-2": {
                "AMI": "ami-a148d59b",
                "AvailabilityZone": "ap-southeast-2a"
            },
            "ap-northeast-1": {
                "AMI": "ami-3561fe34",
                "AvailabilityZone": "ap-northeast-1a"
            }
        }
    },
    "Resources": {
        "EC2Instance": {
            "Type": "AWS::EC2::Instance",
            "Properties": {
                "InstanceType": { "Ref": "InstanceType" },
                "KeyName": { "Ref": "KeyName" },
                "ImageId": {
                    "Fn::FindInMap": [
                        "RegionMap",
                        { "Ref": "AWS::Region" },
                        "AMI"
                    ]
                },
                "AvailabilityZone": {
                    "Fn::FindInMap": [
                        "RegionMap",
                        { "Ref": "AWS::Region" },
                        "AvailabilityZone"
                    ]
                },
                "Tags": [
                    {
                        "Key":   "Name",
                        "Value": "EC2 Instance"
                    }
                ],
                "BlockDeviceMappings": [
                    {
                        "DeviceName": "/dev/sda1",
                        "Ebs": {
                            "VolumeSize": { "Ref": "BlockDeviceVolumeSize"},
                            "VolumeType": { "Ref": "BlockDeviceVolumeType"}
                        }
                    }
                ]
            }
        },
        "EC2EIP": {
            "Type": "AWS::EC2::EIP",
            "Properties": {
                "InstanceId": { "Ref": "EC2Instance" }
            }
        }
    }
}
    EOS
    params 'TODO' # TODO: なにが入るべき?
    user
  end
end
