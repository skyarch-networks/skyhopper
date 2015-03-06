#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class RDS
  Types = %w[
    db.t1.micro
    db.m3.medium db.m3.large db.m3.xlarge db.m3.2xlarge
    db.m1.small db.m1.medium db.m1.large db.m1.xlarge
    db.m2.xlarge db.m2.2xlarge db.m2.4.xlarge
    db.cr1.8xl
  ].recursive_freeze
end
