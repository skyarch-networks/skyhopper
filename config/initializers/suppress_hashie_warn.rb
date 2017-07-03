# ref: https://github.com/intridea/hashie/pull/381
require 'hashie'
class Hashie::Mash
  private def log_built_in_message(method_key); end
end
