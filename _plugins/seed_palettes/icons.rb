# SVG image documents need colors embedded at build time.
module SeedPalettes
  module Icons
    # Pico-compatible image geometry, with strokes supplied by semantic roles.
    SHAPES = {
      "checkbox" => ["on-accent", 4, "<polyline points='20 6 9 17 4 12'/>"],
      "minus" => ["on-accent", 4, "<path d='M5 12h14'/>"],
      "chevron" => ["text-muted", 2, "<polyline points='6 9 12 15 18 9'/>"],
      "date" => ["text-muted", 2, "<rect x='3' y='4' width='18' height='18' rx='2'/><path d='M16 2v4M8 2v4M3 10h18'/>"],
      "time" => ["text-muted", 2, "<circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/>"],
      "search" => ["text-muted", 1.5, "<circle cx='11' cy='11' r='8'/><path d='m21 21-4.35-4.35'/>"],
      "close" => ["text-muted", 3, "<path d='m18 6-12 12M6 6l12 12'/>"],
      "loading" => ["text-muted", 4, "<circle cx='12' cy='12' r='10' stroke-dasharray='45 18'><animateTransform attributeName='transform' type='rotate' from='0 12 12' to='360 12 12' dur='1s' repeatCount='indefinite'/></circle>"],
      "valid" => ["success-text", 2, "<polyline points='20 6 9 17 4 12'/>"],
      "invalid" => ["danger-text", 2, "<circle cx='12' cy='12' r='10'/><path d='M12 8v4m0 4h.01'/>"],
    }.freeze

    def self.values(colors)
      icons = SHAPES.dup
      %w[loading chevron].each do |name|
        %w[accent secondary contrast].each do |family|
          role = family == "contrast" ? "background" : "on-#{family}"
          icons["#{name}-on-#{family}"] = [role, *SHAPES.fetch(name).drop(1)]
        end
      end
      icons.transform_values do |role, width, body|
        svg = "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#{colors.fetch(role).hex}' stroke-width='#{width}' stroke-linecap='round' stroke-linejoin='round'>#{body}</svg>"
        encoded = svg.gsub(/[^A-Za-z0-9_.~-]/) { |character| "%%%02X" % character.ord }
        "url(\"data:image/svg+xml,#{encoded}\")"
      end
    end
  end
end
