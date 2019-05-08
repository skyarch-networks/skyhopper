#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class InfrastructureLog < ActiveRecord::Base
  belongs_to :infrastructure
  belongs_to :user

  scope :security_update, lambda { |physical_id|
    where(InfrastructureLog.arel_table[:details].matches("yum%security%#{physical_id}%finished%"))
  }

  class << self
    def for_infra(infra_id)
      where(infrastructure_id: infra_id).eager_load(:user).preload(:infrastructure)
    end

    # define success and fail
    %i[success fail].each do |name|
      define_method(name, lambda { |infrastructure_id:, details:, user_id:|
        begin
          create(
            status: name == :success,
            details: details,
            infrastructure_id: infrastructure_id,
            user_id: user_id,
          )
        rescue ::ActiveRecord::StatementInvalid => ex
          if ex.message.include?('Data too long')

            sliced = details.byteslice(0, 16_000_000).chop

            log = create(
              status: name == :success,
              details: sliced,
              infrastructure_id: infrastructure_id,
              user_id: user_id,
            )
            log.save!

            dest = File::join(AppSetting.get.log_directory, "infralog_#{log.id}.log")
            log.details = "This log is too long. Full log is in \"#{dest}\"\n" + sliced

            File.open(dest, 'w') do |of|
              of.write(details)
            end

            log.save!
          end
        end
      },)

      def export_as_zip
        zipfile = Tempfile.open('infrastructure_logs')
        ::Zip::File.open(zipfile.path, ::Zip::File::CREATE) do |zip|
          all.find_each do |infrastructure_log|
            zip.get_output_stream(infrastructure_log.to_filename) { |io| io.write(infrastructure_log.to_text) }
          end
        end
        yield(zipfile)
      ensure
        zipfile.close
      end
    end

    # @param [Integer] infra_id
    # @param [String] physical_id
    # @return [Integer|nil]
    def number_of_security_updates(infra_id, physical_id)
      log = where(infrastructure_id: infra_id).security_update(physical_id).last
      return unless log

      if /Complete!\Z/.match?(log.details)
        0
      else
        num = log.details[/(\d+|No) package\(?s\)? needed for security/, 1]
        num == 'No' ? 0 : num.to_i
      end
    end
  end

  def to_text
    at_text = created_at.strftime('%Y/%m/%d %H:%M:%S')
    operator_text = user.try(:email) || 'Unregistered'
    status_text = status ? 'SUCCESS' : 'FAILD'
    <<~"EOS"
      ===== Information =====
      StackName: #{infrastructure.stack_name}
      at: #{at_text}
      Operator: #{operator_text}
      Status: #{status_text}
      ===== Details =====
      #{details}
    EOS
  end

  def to_filename
    created_at_text = created_at.strftime('%Y%m%d%H%M%S')
    "infrastructure_log-#{id}-#{infrastructure.stack_name}-#{created_at_text}.log"
  end
end
