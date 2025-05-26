Jekyll::Hooks.register :site, :post_write do |site|
  baseurl = site.baseurl.to_s
  Dir.glob(File.join(site.dest, '**/pic.json')).each do |file|
    pics = JSON.parse(File.read(file))
    pics.each do |pic|
      if !baseurl.empty? && !pic['src'].start_with?(baseurl)
        pic['src'] = File.join(baseurl, pic['src']).gsub(/\/+/, '/')
      end
    end
    File.open(file, 'w') do |f|
      f.write(JSON.pretty_generate(pics))
    end
  end
end
