def format_table_caption(html)
  html.gsub(/<table\s*([^>]*)>(.*?)<\/table>/m) do |text|
    attributes, content = $1, $2
    attributes = attributes.scan(/(\w+)\s*=\s*["']([^"']*)["']/).to_h
    [
      "<figure><table>#{content}</table>",
      attributes.key?("caption") ? "<figcaption>#{attributes['caption']}</figcaption>" : "",
      "</figure>"
    ].join(" ")
  end
end

def format_image_caption(html)
  html.gsub(/<img\s*([^>]*)>/m) do |text|
    attributes = $1
    attributes = attributes.scan(/(\w+)\s*=\s*["']([^"']*)["']/).to_h
    [
      "<figure",
      attributes.key?("width") ? "style=\"width:#{attributes['width']};\">" : ">",
      "<img src=\"#{attributes['src']}\"",
      attributes.key?("alt") ? "alt=\"#{attributes['alt']}\">" : ">",
      attributes.key?("alt") ? "<figcaption>#{attributes['alt']}</figcaption>" : "",
      "</figure>"
    ].join(" ")
  end
end

module FormatCaption
  def format_caption(html)
    [
      method(:format_table_caption),
      method(:format_image_caption),
    ].reduce(html) do |result, filter| filter.call(result) end
  end
end
Liquid::Template.register_filter(FormatCaption)
