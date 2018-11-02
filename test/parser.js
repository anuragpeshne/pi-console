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
    });
});
