var parser = require('../parser.js');

var assert = require('assert');
describe('Parser', function() {
    describe('#parse_escape_code(input)', function() {
        it('it should parse 256 background color', function() {
            var parsed = parser.parse_escape_code("48;5;209");
            assert.equal(parsed["bg"], '#ff875f');
        });
        it('it should parse 256 foreground color', function() {
            var parsed = parser.parse_escape_code("38;5;209");
            assert.equal(parsed["fg"], '#ff875f');
        });
        it('it should reset', function() {
            var parsed = parser.parse_escape_code("0");
            // https://stackoverflow.com/a/32108184/1291435
            assert.equal(Object.keys(parsed).length, 0);
            assert.equal(parsed.constructor, Object);
        });
        it('it should parse bold and underline', function() {
            var parsed = parser.parse_escape_code("1;4");
            assert.equal(parsed["style"], "bold, underline");
        });
        it('it should parse Bold + Red forground + Green background ', function() {
            var parsed = parser.parse_escape_code("1;31;42");
            assert.equal(parsed["style"], "bold");
            assert.equal(parsed["fg"], "red");
            assert.equal(parsed["bg"], "green");
        });
    });
});
