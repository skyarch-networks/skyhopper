require 'pp'
require 'highline'

class CoolLogFormater
  include ActiveSupport::TaggedLogging::Formatter

  Colors = {
    'FATAL' => :red,
    'ERROR' => :red,
    'WARN' => :yellow,
    'INFO' => :green,
    'DEBUG' => :blue,
  }.freeze

  @@highline = HighLine.new

  def call(severity, timestamp, _progname, msg)
    message = if msg.is_a?(String)
                return '' if msg.empty?

                msg
              else
                msg.pretty_inspect
              end
    time  = "[#{timestamp.strftime('%y/%m/%d %H:%M:%S')}.#{format('%06d', timestamp.usec.to_s)}]"
    level = "[#{@@highline.color(severity, Colors[severity], :bold)}]:"

    level << ' ' if severity == 'WARN' or severity == 'INFO'

    "#{time} #{level} #{message}\n"
  end
end

Rails.logger.formatter = CoolLogFormater.new

# for aws-sdk-v1
AWS.config(logger: Rails.logger, log_formatter: AWS::Core::LogFormatter.colored)

# for aws-sdk-v2
Aws.config[:logger]        = Rails.logger
Aws.config[:log_formatter] = Seahorse::Client::Logging::Formatter.colored
