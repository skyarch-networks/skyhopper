require 'shellwords'
require 'open3'

module KnownHosts
  class CommandNotSuccessError < ::RuntimeError; end
  class AnalysisNotSuccessError < ::RuntimeError; end

  def self.exec_command(command)
    out, err, status = Open3.capture3(command)
    raise CommandNotSuccessError unless status.success?
    return out
  end

  def self.exist?(domain_name)
    command  = "ssh-keygen -F #{Shellwords.escape(domain_name)}"
    result = exec_command(command)

    # 空文字列が返ってきた場合は見つからなかったと判断する
    return false if result == ''

    # 見つかったという内容のメッセージが返ってきた場合は見つかったと判断する
    exist_text_regex_string = "Host #{Regexp.escape(domain_name)} found: line \\d+"
    exist_text_regex = Regexp.new(exist_text_regex_string)
    match = exist_text_regex.match(result)
    return true if match

    # コマンドが想定外の値を返した場合は例外を投げる
    raise AnalysisNotSuccessError
  end
end
