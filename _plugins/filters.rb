# my custom filters

module Jekyll
    module MyFilters
        def word_info(input)
            cjk_charset = '\p{Han}\p{Katakana}\p{Hiragana}\p{Hangul}'
            cjk_regex = %r![#{cjk_charset}]!o
            word_regex = %r![^#{cjk_charset}\s]+!o

            cjk_length = input.scan(cjk_regex).length
            word_length = input.scan(word_regex).length

            cjk_time = cjk_length / 200
            word_time = word_length / 100
            
            cjk_length + word_length, cjk_time + word_time + 1
        end
    end
end

Liquid::Template.register_filter(Jekyll::MyFilters)
