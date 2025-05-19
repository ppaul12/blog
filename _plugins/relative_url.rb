Jekyll::Hooks.register :site, :post_write do |site|
  Dir.glob(File.join(site.dest, '**/pic.json')).each do |file|
    pics = JSON.parse(File.read(file))
    pics.each do |pic|
      pic['src'] = File.join(site.baseurl || '/', pic['src']).gsub(/\/+/, '/')
    end
    File.open(file, 'w') do |f|
      f.write(JSON.pretty_generate(pics))
    end
  end
end
