class ERB::Builder
  TemplateRoot = Rails.root.join('lib', 'templates')
  ModuleRoot   = Rails.root.join('lib', 'modules')

  class << self
    def _init
      @modules = {}
    end

    # @param [Symbol] name
    # @param [String] value
    def assign_module(name, value)
      @modules[name] = value
    end

    # @param [Symbol] name
    # @return [String]
    def modules(name)
      return @modules[name]
    end
  end

  _init()

  # @param [String] name
  def initialize(name)
    fname = TemplateRoot.join("#{name}.erb")
    @value = File.read(fname)
  end

  # @return [String]
  def build
    return ERB.new(@value).result(binding)
  end

  # @param [Symbol] name
  # @return [String]
  def module(name)
    m = self.class.modules(name)
    return m if m

    fname = ModuleRoot.join("#{name}.rb")
    return eval(File.read(fname)).to_s
  end
end
