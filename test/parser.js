var parser = require('../parser.js');

var assert = require('assert');
describe('Parser', function() {
    describe('#parse_escape_code(input)', function() {
        it('should parse 256 background color', function() {
            var parsed = parser.parse_escape_code("48;5;209");
            assert.equal(parsed["bg"], '#ff875f');
        });
        it('should parse 256 foreground color', function() {
            var parsed = parser.parse_escape_code("38;5;209");
            assert.equal(parsed["fg"], '#ff875f');
        });
        it('should reset', function() {
            var parsed = parser.parse_escape_code("0");
            // Object Empty https://stackoverflow.com/a/32108184/1291435
            assert.equal(Object.keys(parsed).length, 0);
            assert.equal(parsed.constructor, Object);
        });
        it('should parse bold and underline', function() {
            var parsed = parser.parse_escape_code("1;4");
            assert.equal(parsed["style"], "bold, underline");
        });
        it('should parse Bold + Red forground + Green background ', function() {
            var parsed = parser.parse_escape_code("1;31;42");
            assert.equal(parsed["style"], "bold");
            assert.equal(parsed["fg"], "red");
            assert.equal(parsed["bg"], "green");
        });
    });

    describe('#parse_console_input(input, pos)', function() {
        var ESC = "\u001b";
        it('should parse simple single line', function() {
            var input_str = "hello world";
            var parsed = parser.parse_console_input(input_str);
            var part1 = parsed[0].value;
            assert.equal(part1, input_str);
        });
        it('should parse single line with escape sequence', function() {
            var input_1 = "hello";
            var input_2 = " world";
            var input_str = ESC + "[31m" + input_1 + ESC + "[0m" + input_2;
            var parsed = parser.parse_console_input(input_str);

            assert.equal(parsed.length, 2);

            var part1 = parsed[0];
            assert.equal(part1.value, input_1);
            assert.equal(part1.style.fg, "red");

            var part2 = parsed[1];
            assert.equal(part2.value, input_2);
            assert.equal(Object.keys(part2.style).length, 0);
            assert.equal(part2.style.constructor, Object);
        });

        it('should parse single line without reseting control sequence', function() {
            var input_1 = "hello";
            var input_2 = " world";
            var input_str = ESC + "[31m" + input_1 + input_2;
            var parsed = parser.parse_console_input(input_str);

            assert.equal(parsed.length, 1);

            var part1 = parsed[0];
            assert.equal(part1.value, input_1 + input_2);
            assert.equal(part1.style.fg, "red");
        });

        it('should parse newline', function() {
            var input_part1 = "part1";
            var input_part2 = "part2";
            var input_str = input_part1 + "\n" + ESC + "[31m" + input_part2 + ESC + "[0m";

            var parsed = parser.parse_console_input(input_str);
            assert.equal(parsed.length, 3);
            assert.equal(parsed[1].value, "\n");
        });
    });

    describe('#to_HTML(json_code)', function() {
        var span_style_regex = /span style="([aA-zZ\-:';]*?)"/g; // non greedy
        var span_content = /span .*>(.*?)<\/span>/g;
        var ESC = "\u001b";

        it('should convert empty json array', function() {
            var empty_input = "";
            var parsed_input = parser.parse_console_input(empty_input);
            var actual_html = parser.to_HTML(parsed_input);
            assert.equal(actual_html.length, 0);
        });

        it('should convert simple string', function() {
            var input = "Hello World";
            var parsed_input = parser.parse_console_input(input);
            var parsed_html = parser.to_HTML(parsed_input);

            span_style_regex.lastIndex = 0;
            var parsed_style = span_style_regex.exec(parsed_html);
            assert.equal(parsed_style[1], "");

            var parsed_content = span_content.exec(parsed_html);
            assert.equal(parsed_content[1], input);
        });

        it('should parsed string with escape codes', function() {
            var input_1 = "hello";
            var input_2 = " world";
            var input_str = ESC + "[31m" + input_1 + ESC + "[0m" + input_2;
            var parsed = parser.parse_console_input(input_str);
            var html = parser.to_HTML(parsed);

            span_style_regex.lastIndex = 0;
            var parsed_style1 = span_style_regex.exec(html);
            assert.equal(parsed_style1[1], "color:'red';");

            var parsed_style2 = span_style_regex.exec(html);
            assert.equal(parsed_style2[1], "");
        });

        it('should parse newline', function() {
            var input_part1 = "part1";
            var input_part2 = "part2";
            var input_str = input_part1 + "\n" + ESC + "[31m" + input_part2 + ESC + "[0m";

            var parsed = parser.parse_console_input(input_str);
            var html = parser.to_HTML(parsed);
            assert.equal((html.indexOf('<br/>') != -1), true);
        });
    });
});
