# Insert the TOC before Markdown conversion so Kramdown sees the article's headings.
Jekyll::Hooks.register :posts, :pre_render do |post|
  next unless post.data["toc"] == true

  include_tag = "{% include toc.html %}\n\n"
  post.content = include_tag + post.content unless post.content.start_with?(include_tag)
end
