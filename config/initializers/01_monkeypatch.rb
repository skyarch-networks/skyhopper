class Hash
  def symbolize_keys_recursive
    result = symbolize_keys
    result.each_pair do |_, val|
      val.symbolize_keys! if val.is_a?(Hash)
    end
  end

  def recursive_freeze
    freeze
    each do |_, val|
      if defined? val.recursive_freeze
        val.recursive_freeze
      else
        val.freeze
      end
    end
  end
end

class Array
  def recursive_freeze
    freeze
    each do |x|
      if defined? x.recursive_freeze
        x.recursive_freeze
      else
        x.freeze
      end
    end
  end
end

class Thread
  def self.new_with_db(*args, &block)
    curryed_block = block.curry(args.size + 1)
    args.each do |arg|
      curryed_block = curryed_block[arg]
    end

    Thread.new do
      ActiveRecord::Base.connection_pool.with_connection(&curryed_block)
    end
  end
end

module ErrorHandlize
  refine StandardError do
    def format_error
      {
        message: message,
        kind: self.class.to_s,
      }
    end

    def status_code
      500
    end
  end

  refine Pundit::NotAuthorizedError do
    def format_error
      {
        # TODO: I18n
        message: "not allowed to #{query} for this #{record.class.to_s.downcase}",
        kind: self.class.to_s,
      }
    end

    def status_code
      403
    end
  end
end
