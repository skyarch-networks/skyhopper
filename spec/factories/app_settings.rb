#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

# Read about factories at https://github.com/thoughtbot/factory_girl

FactoryGirl.define do
  factory :ec2_private_key do
    name 'hoge'
    value <<~EOS
      -----BEGIN RSA PRIVATE KEY-----
      MIIEpQIBAAKCAQEAz0oTOf3uZjHX9zPyPoVOYngOO8qqcPX0MPSQSKD5Hz5eVJzI
      1KKZqCztlFgb0u4dmWJLBFqCEMzNWHXk+7eqUDmb84B70+kfI5W0PvrZN4hTRKUk
      6cUaZgAWDmBbwOmM9BCo+Adrfo+W6ry5+6Q7h+KgIHq86iPe+e2kYFew/lADBczX
      6s7BlwqxqkgeT+2UPpFWHDqtFPTkfLNuK4SQs7OmdjRrQSI2BYi3XC//pATOawGV
      4bEUPBWJOo8UQtKkCMfGwAHegKowmTjWCAEpcDP5sJanbNWNadJISB1TsbjbANsb
      HRVFRHkB67vF2VYmoNy++l5ZvD+Qcj4X2GERHwIDAQABAoIBAGheDoIjVTYFIIyp
      je1mpwmzEs+OAfTwESvY5xB6ZBQUDeCiNAfDeoQPYutO1WuFUkfZEpY1j8kvpLBG
      Y61NUyYja17VsQMIHBKJnIAdQuLP88TbNVOyVtFGd9RzNZ9SuBJmlPyUl83YNA8q
      SKXnkcWgGCliQt3Mg8bonNuZK1dPP82sm/sZvz5908SOr3tTxlPyZTN7ekGnL8Jd
      MU6kvQBEuraxJbWnYtS81HlYyNeFJOe7wNbSlGvn6PkzgpCp9Zq5ynuV6YJ9QOGZ
      GE1PFmGrD9/d8tgGU6WAJSNIPj/i5bIqQFH1mDwKGEz7qrInR7WSqEmI1DpFS2nI
      wbjAgiECgYEA5vUasRyZRfpmLaAXFg3BigwW0FiSK3D+hPjFjYEzH6UVjNtdG5Yz
      CW1UlkgszoVfcQvmSTMRwirGoJIHcPSXhv1KMnyFEvoOd5T1tkikLo8b8Jnu5+uo
      mhNFnRK8AhHvrO0tMwtFzA+1JEQFA2QaqAW6cP7te4hqeIpLSaKhO7ECgYEA5cP+
      jNBKTaxaRFta6z4O4wsVjhr67LYk9VjFMB5/f17+1pHtiRqTQBUXYBjp5/rjXZjy
      gIa336cIYRTc20+vdlpXt5WLM4+t96KIBLD198safZxU8jh+o9kbgmGRgFvqT6OC
      sGr0KS6qHwiXgQSq7YT/LRvenlPoqYdDcO+a3c8CgYEAqz++hOjhtYOPU/FKbO3S
      Pdvs5ptl9pQYBNy5Ds1n7OTpb8IP7a6XNTw95hiqMI+wTxA1tr0JQ+GX2eOtZNHX
      sR4KcBjoS0PiikSHVJvUMTmny+U3wft4zpXPnkIP6bEG+D/8rcaEAGT9OWC+Ht+Q
      7Fki/znnORvTZoGUhYry5mECgYEA0or0+OftDpv+42CrQaFOVvLTP7KteLe3yjMc
      DmoD/x13e/ugpN/7St+I2gA6Zt7Z9eyvWuMYHxOadAuADl9Is7U5Z/ra4dapXaBL
      77CQ1A4DKlNU69ilA1NxB9qMUAjp/ywgF7UKI6qlLWbcHde/IYObqSQ+rOrK6n4O
      aLDHQrUCgYEA5Pg1HhcKEKm0oMinpXlYVoERUquED/6tX+MifjHnOL+Q06/Y/jdI
      udcACU6HXswgYFwYKX2Br+ee7M300pydHb/rQxpp0YVfMVG+Fx+IMlnomRqlU0pS
      VGFyrUuB4RdiyT3WzLYNOcUZiUk5K0wJ67Mg9J5RI4paG3vfgDby2vs=
      -----END RSA PRIVATE KEY-----
    EOS
  end

  factory :app_setting do
    log_directory '~/skyhopper_log/'
    aws_region 'ap-northeast-1'
    ec2_private_key
    dummy false
  end
end
