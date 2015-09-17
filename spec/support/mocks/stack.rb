#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module StackStub
  # AWSやChefに接続する部分をstub化して、テストが遅くなるのを防ぐ。

  # opt = {METHOD_NAME: ACTION}
  def stubize_stack(opt = {})
    let(:_cf){double('@cloud_formation')}
    let(:_stack){double('@stack')}
    let(:cf_validate_error){Aws::CloudFormation::Errors::ValidationError.new('CONTEXT', 'MESSAGE')}

    before do
      allow(Aws::CloudFormation::Resource).to receive(:new).and_return(_cf)

      # new
      allow(_cf).to receive(:stack).and_return(_stack)

      # delete
      if opt[:delete] == :error
        allow(_stack).to receive(:delete).and_raise(StandardError)
      else
        allow(_stack).to receive(:delete)
      end

      # status
      allow(_stack).to receive(:stack_status).and_return("CREATE_COMPLETE")

      allow(_stack).to receive(:reload)

      # events
      if opt[:events] == :error
        allow(_stack).to receive(:events).and_raise(cf_validate_error)
      else
        allow_any_instance_of(Stack).to receive(:events).and_return([{
          time:    Time.zone.now,
          type:    "AWS::CloudFormation::Stack",
          logical: "stack",
          status:  "CREAT_COMPLETE",
          reason:  nil
        }])
      end
    end
  end
end
