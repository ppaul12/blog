require_relative "color"
require_relative "icons"

module SeedPalettes
  class Palette
    SURFACE_LEVELS = {
      "background" => [0.97, 0.22], "surface" => [0.94, 0.27],
      "surface-raised" => [0.99, 0.31], "border-subtle" => [0.87, 0.35],
    }.freeze
    STATE_HUES = { "success" => 145, "warning" => 85, "danger" => 25 }.freeze

    CHROMA_CURVE = [[0.0, 0.0], [0.15, 0.35], [0.35, 0.75], [0.55, 1.0],
                    [0.70, 1.0], [0.85, 0.55], [0.95, 0.20], [0.98, 0.08], [1.0, 0.0]].freeze

    def initialize(seeds)
      raise ArgumentError, "each palette requires an accent seed" unless seeds.is_a?(Hash) && seeds.key?("accent")
      unknown = seeds.keys - %w[accent secondary neutral]
      raise ArgumentError, "unknown palette seeds: #{unknown.join(', ')}" unless unknown.empty?

      _, c, h = Color.parse(seeds.fetch("accent")).lch
      @accent = [c, h]
      @secondary = if seeds.key?("secondary")
        Color.parse(seeds["secondary"]).lch.drop(1)
      else
        [c * 0.8, (h + 60) % 360]
      end
      @neutral = if seeds.key?("neutral")
        _, nc, nh = Color.parse(seeds["neutral"]).lch
        [[nc, 0.025].min, nh]
      else
        [[c * 0.12, 0.018].min, h]
      end
    end

    def roles(mode)
      dark = mode == "dark"
      colors = neutral_roles(dark)
      surfaces = colors.values_at("background", "surface", "surface-raised")
      add_family_roles(colors, surfaces, dark)
      add_category_roles(colors, surfaces, dark)
      add_map_roles(colors)
      add_tag_roles(colors, dark)
      colors["particle"] = colors.fetch("text-muted")
      colors
    end

    def css(name)
      %w[light dark].map do |mode|
        colors = roles(mode)
        declarations = colors.map { |role, color| "  --site-#{role}: #{color.hex};" }
        declarations.concat(Icons.values(colors).map { |icon, value| "  --site-icon-#{icon}: #{value};" })
        declarations << "  --site-border-rgb: #{colors.fetch('border-subtle').rgb.join(', ')};"
        declarations << "  --site-shadow-color: #{mode == 'dark' ? 'rgb(0 0 0 / 35%)' : 'rgb(0 0 0 / 18%)'};"
        ":root[data-palette=\"#{name}\"][data-theme=\"#{mode}\"] {\n#{declarations.join("\n")}\n}"
      end.join("\n\n")
    end

    private

    def tone(seed, lightness)
      c, h = seed
      lower, upper = CHROMA_CURVE.each_cons(2).find { |a, b| lightness.between?(a[0], b[0]) }
      fraction = (lightness - lower[0]) / (upper[0] - lower[0])
      factor = lower[1] + (upper[1] - lower[1]) * fraction
      Color.from_lch(lightness, c * factor, h)
    end

    def fit(seed, lightness, backgrounds, ratio)
      original = tone(seed, lightness)
      return original if backgrounds.all? { |bg| original.contrast(bg) >= ratio }

      # Check quantized output, including all actual surfaces, rather than OKLCH L.
      candidates = (0..200).sort_by { |i| (i / 200.0 - lightness).abs }
      candidates.each do |i|
        color = tone(seed, i / 200.0)
        return color if backgrounds.all? { |bg| color.contrast(bg) >= ratio }
      end
      raise ArgumentError, "cannot satisfy contrast #{ratio} for generated color"
    end

    def category_chroma
      ((@accent[0] + @secondary[0]) / 2).clamp(0.08, 0.16)
    end

    def category_hues
      first = @accent[0] < 0.002 ? 250.0 : @accent[1]
      second = @secondary[0] < 0.002 ? first + 100 : @secondary[1]
      second = (first + 100) % 360 if hue_distance(first, second) < 45
      [first, second]
    end

    def hue_distance(first, second)
      ((second - first + 180) % 360 - 180).abs
    end

    def neutral_roles(dark)
      colors = SURFACE_LEVELS.to_h do |name, levels|
        [name, tone(@neutral, levels[dark ? 1 : 0])]
      end
      surfaces = colors.values_at("background", "surface", "surface-raised")
      colors["text"] = fit(@neutral, dark ? 0.94 : 0.25, surfaces, 7)
      colors["text-muted"] = fit(@neutral, dark ? 0.75 : 0.45, surfaces, 4.5)
      colors["border-control"] = fit(@neutral, dark ? 0.57 : 0.62, surfaces, 3)
      colors
    end

    def add_family_roles(colors, surfaces, dark)
      families = { "accent" => @accent, "secondary" => @secondary, "info" => @accent }
      STATE_HUES.each { |name, hue| families[name] = [category_chroma, hue] }
      families.each do |name, seed|
        colors["#{name}-subtle"] = tone(seed, dark ? 0.30 : 0.93)
        backgrounds = surfaces + [colors["#{name}-subtle"]]
        colors["#{name}-text"] = fit(seed, dark ? 0.79 : 0.45, backgrounds, 4.5)
        colors["#{name}-hover"] = fit(seed, dark ? 0.87 : 0.37, surfaces, 4.5)
        colors["#{name}-fill"] = fit(seed, dark ? 0.74 : 0.49, surfaces, 3)
        colors["#{name}-hover-fill"] = fit(seed, dark ? 0.80 : 0.43, surfaces, 3)
        fills = colors.values_at("#{name}-fill", "#{name}-hover-fill")
        foreground = [tone(@neutral, 0.12), tone(@neutral, 0.99)].max_by { |v| v.contrast(fills.first) }
        colors["on-#{name}"] = fit(@neutral, foreground.lch[0], fills, 4.5)
        colors["#{name}-border"] = fit(seed, dark ? 0.72 : 0.54, backgrounds, 3)
      end
    end

    def add_category_roles(colors, surfaces, dark)
      # Category identity is independent of state colors and stable across modes.
      category_hues.each_with_index do |hue, index|
        colors["category-#{index + 1}"] = fit([category_chroma, hue], dark ? 0.75 : 0.55, surfaces, 3)
      end
    end

    def add_map_roles(colors)
      # OSM stays light: overlay colors are identical in both page schemes.
      first_hue, second_hue = category_hues
      map_hues = []
      [first_hue, second_hue, first_hue + 150, second_hue + 150].each do |hue|
        hue %= 360
        hue = (hue + 47) % 360 while map_hues.any? { |other| hue_distance(hue, other) < 40 }
        map_hues << hue
      end
      halo = Color.parse("#ffffff")
      map_hues.each_with_index do |hue, index|
        colors["map-track-#{index + 1}"] = fit([category_chroma, hue], 0.50, [halo], 4.5)
      end
      colors["map-halo"] = halo
      colors["map-photo-fill"] = tone(@secondary, 0.70)
      colors["map-residence-fill"] = tone([category_chroma, STATE_HUES.fetch("danger")], 0.52)
      %w[photo residence].each do |name|
        fill = colors["map-#{name}-fill"]
        start = [0.12, 0.99].max_by { |lightness| tone(@neutral, lightness).contrast(fill) }
        colors["on-map-#{name}"] = fit(@neutral, start, [fill], 4.5)
      end
      [0.84, 0.74, 0.64].each_with_index do |level, index|
        colors["map-cluster-#{index + 1}"] = tone(@accent, level)
      end
      colors["on-map-cluster"] = fit(@neutral, 0.16,
        colors.values_at("map-cluster-1", "map-cluster-2", "map-cluster-3"), 4.5)
    end

    def add_tag_roles(colors, dark)
      # All eleven backgrounds share one foreground checked against every step.
      tags = (0..10).map do |i|
        Color.mix(colors["accent-subtle"], colors["secondary-subtle"], i / 10.0)
      end
      tags.each_with_index { |color, i| colors["tag-#{i}"] = color }
      colors["tag-text"] = fit(@neutral, dark ? 0.94 : 0.25, tags, 4.5)
    end
  end
end
