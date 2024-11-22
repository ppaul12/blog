%w[gallery map image youtube].each do |tag|
  cls = Class.new(Jekyll::Tags::IncludeTag) do
    def initialize(tag, params, tokens)
      super(tag, "embed/#{tag}.html #{params}", tokens)
    end
  end
  Liquid::Template.register_tag(tag, cls)
end
