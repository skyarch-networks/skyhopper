#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module S3Stub
  def stubize_s3(opt = {})
    let(:_s3){double('s3')}
    before do
      allow(S3).to receive(:new).and_return(_s3)
      [].each do |name|
        allow(_s3).to receive(name).and_return(opt[name] || double(name))
      end
    end
  end
end
