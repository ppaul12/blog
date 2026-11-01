# Build-time entry point: validate configuration and publish generated CSS.
require_relative "seed_palettes/palette"

module SeedPalettes
  def self.generate(palettes, appearance)
    raise ArgumentError, "_data/palettes.yml must contain named palettes" unless palettes.is_a?(Hash) && !palettes.empty?
    raise ArgumentError, "appearance must be a mapping" unless appearance.is_a?(Hash)
    selected = appearance.fetch("palette", "nord")
    mode = appearance.fetch("mode", "auto")
    raise ArgumentError, "unknown default palette: #{selected.inspect}" unless palettes.key?(selected)
    raise ArgumentError, "appearance.mode must be auto, light, or dark" unless %w[auto light dark].include?(mode)
    css = palettes.map do |name, seeds|
      raise ArgumentError, "invalid palette name: #{name.inspect}" unless name.is_a?(String) && name.match?(/\A[a-z][a-z0-9-]*\z/)
      Palette.new(seeds).css(name)
    end.join("\n\n")
    [css, { "palette" => selected, "mode" => mode }]
  end
end

if defined?(Jekyll::Generator)
  module SeedPalettes
    class Generator < Jekyll::Generator
      safe true
      priority :high

      def generate(site)
        css, appearance = SeedPalettes.generate(site.data["palettes"], site.config.fetch("appearance", {}))
        site.data["appearance"] = appearance
        page = Jekyll::PageWithoutAFile.new(site, site.source, "assets", "palettes.css")
        page.content = "/* Generated from _data/palettes.yml. */\n#{css}\n"
        page.data["layout"] = nil
        site.pages << page
      rescue ArgumentError => error
        raise Jekyll::Errors::FatalException, "Palette configuration: #{error.message}"
      end
    end
  end
end
