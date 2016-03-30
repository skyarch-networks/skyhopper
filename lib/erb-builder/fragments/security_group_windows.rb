{
  "Type": "AWS::EC2::SecurityGroup",
  "Properties": {
    "GroupDescription": "Enable WINRM/HTTP/HTTPS",
    "SecurityGroupIngress": [{
      "IpProtocol": "tcp",
      "FromPort": "5985",
      "ToPort": "5985",
      "CidrIp": "0.0.0.0/0",
    }, {
      "IpProtocol": "tcp",
      "FromPort": "5986",
      "ToPort": "5986",
      "CidrIp": "0.0.0.0/0",
    }, {
      "IpProtocol": "tcp",
      "FromPort": "80",
      "ToPort": "80",
      "CidrIp": "0.0.0.0/0",
    }, {
      "IpProtocol": "tcp",
      "FromPort": "443",
      "ToPort": "443",
      "CidrIp": "0.0.0.0/0",
    }],
  },
}
