#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

RSpec.describe CloudProvider, :type => :model do

  describe "aws" do
    context "when exists" do

      subject{CloudProvider.aws}

      it "should return method" do
        expect(subject.name).to eq 'AWS'
      end
    end

    context "when does not exist" do

      before do
        CloudProvider.where(name: "AWS").destroy_all
      end

      subject{CloudProvider.aws}

      it "should raise error" do
        expect{subject}.to raise_error(ActiveRecord::RecordNotFound)
      end

      after do
        create(:cloud_provider, name: "AWS")
      end
   end
  end
end
