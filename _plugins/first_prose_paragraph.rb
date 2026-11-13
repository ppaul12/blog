# frozen_string_literal: true

require "kramdown"

module FirstProseParagraph
  include Liquid::StandardFilters

  def first_prose_paragraph(html)
    document = Kramdown::Document.new(html.to_s, input: "html")
    fragment = document.root.dup

    document.root.children.each do |node|
      next unless node.type == :p

      fragment.children = [node]
      paragraph, = Kramdown::Converter::Html.convert(fragment, document.options)
      text = strip_html(paragraph.gsub(/<br\s*\/?>/i, " ")).gsub(/\s+/, " ").strip
      return text unless text.empty?
    end

    ""
  end
end

Liquid::Template.register_filter(FirstProseParagraph)
