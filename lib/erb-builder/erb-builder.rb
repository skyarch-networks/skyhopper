class ERB::Builder
  TemplateRoot = Rails.root.join('lib', 'erb-builder', 'templates')
  FragmentRoot = Rails.root.join('lib', 'erb-builder', 'fragments')

  # @param [String] name
  def initialize(name)
    fname = TemplateRoot.join("#{name}.json.erb")
    @value = File.read(fname)
  end

  # @return [String]
  def build
    return pretty(ERB.new(@value).result(binding))
  end

  # @param [Symbol] name
  # @return [String] As a JSON
  def fragment(name)
    fname = FragmentRoot.join("#{name}.rb")
    # rubocop:disable Lint/Eval
    return eval(File.read(fname)).to_json
    # rubocop:enable Lint/Eval
  end

  # @param [String] json
  # @return [String] pretty json.
  def pretty(json)
    return JSON.pretty_generate(JSON.parse(json))
  end
end
