# sRGB/OKLCH conversion, gamut mapping, interpolation, and contrast.
module SeedPalettes
  class Color
    attr_reader :rgb

    def initialize(rgb)
      @rgb = rgb.map { |channel| (channel.clamp(0.0, 1.0) * 255).round }
    end

    def self.parse(value)
      unless value.is_a?(String) && value.match?(/\A#(?:[0-9a-f]{3}|[0-9a-f]{6})\z/i)
        raise ArgumentError, "seed colors must be #RGB or #RRGGBB: #{value.inspect}"
      end
      hex = value.delete_prefix("#")
      hex = hex.chars.map { |digit| digit * 2 }.join if hex.length == 3
      new(hex.scan(/../).map { |channel| channel.to_i(16) / 255.0 })
    end

    def self.linear_rgb(lightness, chroma, hue)
      angle = hue * Math::PI / 180
      a = chroma * Math.cos(angle)
      b = chroma * Math.sin(angle)
      l = (lightness + 0.3963377774 * a + 0.2158037573 * b)**3
      m = (lightness - 0.1055613458 * a - 0.0638541728 * b)**3
      s = (lightness - 0.0894841775 * a - 1.2914855480 * b)**3
      [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
       -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
       -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s]
    end

    def self.from_lch(lightness, chroma, hue)
      # Conservative sRGB gamut mapping: retain L/H and reduce C by bisection.
      channels = linear_rgb(lightness, chroma, hue)
      unless channels.all? { |v| v.between?(-1e-6, 1.0 + 1e-6) }
        low = 0.0
        high = chroma
        24.times do
          middle = (low + high) / 2
          channels = linear_rgb(lightness, middle, hue)
          if channels.all? { |v| v.between?(-1e-8, 1.0 + 1e-8) }
            low = middle
          else
            high = middle
          end
        end
        channels = linear_rgb(lightness, low, hue)
      end
      new(channels.map do |v|
        v <= 0.0031308 ? 12.92 * v : 1.055 * v**(1.0 / 2.4) - 0.055
      end)
    end

    def linear
      rgb.map do |channel|
        v = channel / 255.0
        v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055)**2.4
      end
    end

    def lab
      r, g, b = linear
      l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
      m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
      s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
      [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
       1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
       0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s]
    end

    def lch
      l, a, b = lab
      c = Math.sqrt(a * a + b * b)
      [l, c, c < 0.002 ? 0.0 : Math.atan2(b, a) * 180 / Math::PI % 360]
    end

    def luminance
      r, g, b = linear
      0.2126 * r + 0.7152 * g + 0.0722 * b
    end

    def contrast(other)
      low, high = [luminance, other.luminance].sort
      (high + 0.05) / (low + 0.05)
    end

    def hex
      "#" + rgb.map { |v| "%02x" % v }.join
    end

    def self.mix(first, last, amount)
      lab = first.lab.zip(last.lab).map { |a, b| a + (b - a) * amount }
      l, a, b = lab
      from_lch(l, Math.sqrt(a * a + b * b), Math.atan2(b, a) * 180 / Math::PI)
    end
  end

end
