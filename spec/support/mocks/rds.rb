#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module RDSStub
  def stubize_rds(opt = {})
    let(:_rds){double('rds')}
    before do
      allow(RDS).to receive(:new).and_return(_rds)
      [:db_instance_class, :allocated_storage, :endpoint_address, :multi_az, :engine].each do |name|
        allow(_rds).to receive(name).and_return(opt[name] || double(name))
      end
    end
  end
end
