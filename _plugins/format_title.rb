module FormatTitle
  def format_title(title, is_block = true)
    if title.is_a?(Hash)
      text = title["text"]
      _class = Array(title["class"]).dup || []
      _style = Array(title["style"]).dup || []
      _attr = Array(title["attr"]).dup || []
    else
      text = title.to_s
      _class = []
      _style = []
      _attr = []
    end

    _style << "display: block;" if is_block
    "<span #{_attr.join(' ')} class=\"#{_class.join(' ')}\" style=\"#{_style.join(' ')}\">#{text}</span>"
  end
end
Liquid::Template.register_filter(FormatTitle)
