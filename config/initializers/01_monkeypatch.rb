class Hash
  def symbolize_keys_recursive
    result = self.symbolize_keys
    result.each_pair do |_key, val|
      val.symbolize_keys! if val.is_a?(Hash)
    end
  end

  def recursive_freeze
    freeze
    self.each do |_key, val|
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
    self.each do |x|
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
      return {
        message: self.message,
        kind:    self.class.to_s,
      }
    end

    def status_code
      return 500
    end
  end

  refine Pundit::NotAuthorizedError do
    def format_error
      return {
        # TODO: I18n
        message: self.message,
        kind:    self.class.to_s,
      }
    end

    def status_code
      403
    end
  end
end
