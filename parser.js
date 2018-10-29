// referred: https://misc.flogisoft.com/bash/tip_colors_and_formatting

const ESCAPE_CODES = {
    "\u0008": "backspace",
    "\u001b": "escape"
};

const CONTROL_SEQ_BASIC_LIST = {
    0:  { },
    1:  { "style": "bold" },
    2:  { "style": "dim" },
    4:  { "style": "underline" },
    5:  { "style": "blink" },
    7:  { "style": "reverse" },
    8:  { "style": "hidden" },
    21: { },
    22: { },
    24: { },
    25: { },
    27: { },
    28: { }
};

const CONTROL_SEQ_8_16_LIST = {
    39: { "fg": "" }, // default foreground color
    30: { "fg": "black" },
    31: { "fg": "red" },
    32: { "fg": "green" },
    33: { "fg": "yellow" },
    34: { "fg": "blue" },
    35: { "fg":	"magenta" },
    36: { "fg": "cyan" }	,
    37: { "fg": "light-gray" },
    90: { "fg": "dark-gray" },
    91: { "fg": "light-red" },
    92: { "fg": "light-green" },
    93: { "fg": "light-yellow" },
    94: { "fg": "light-blue" },
    95: { "fg": "light-magenta" },
    96: { "fg": "light-cyan" },
    97: { "fg": "white" },
};

function parse_basic_control_seq(code) {
    if (code in CONTROL_SEQ_BASIC_LIST) {
        return CONTROL_SEQ_BASIC_LIST[code];
    } else {
        return null;
    }
}

function parse_8_16_control_seq(code) {
    // check for foreground color
    if (code in CONTROL_SEQ_8_16_LIST) {
        return CONTROL_SEQ_8_16_LIST[code];
    } else {
        // check for background color
        var fg_code = code - 10;
        if (fg_code in CONTROL_SEQ_8_16_LIST) {
            var fg_style = CONTROL_SEQ_8_16_LIST[fg_code];
            return { "bg": fg_style["fg"] };
        }
    }
    return null;
}

exports.parse_console_input = function (input, pos) {
    var b = (typeof(pos) !== 'undefined') ? pos : 1;
    var output = [];
    while (pos < input.length) {
        var char = input[pos];
        if (char in ESCAPE_CODES) {
            switch (ESCAPE_CODES[char]) {
            case "escape":
                // check next character
                if ((pos + 1) < input.length) {
                    if ((pos + 1) == '[') {
                        pos += 2; // we have parsed until '['
                        var escape_chars = [];
                        var escape_chars_end = pos;
                        while (escape_chars_end < input.length && input[escape_chars_end] != 'm') {
                            escape_chars_end++;
                        }
                        if (escape_chars_end < input.length) {
                            parse_escape_code(input.substring(pos, escape_chars_end));
                        }
                    }
                }
                break;
            case "backspace":
                output.pop();
                break;
            }
        }
    }
};

exports.parse_escape_code = function (input) {
    var control_seq = input.split(';').map(function(e) { return parseInt(e); });
    if (control_seq.length == 3) {
        if (control_seq[0] == 38 && control_seq[1] == 5) {
            // 256 colors foreground
            return { "fg": control_seq[2] };
        } else if (control_seq[0] == 48 && control_seq[1] == 5) {
            // 256 colors background
            return { "bg": control_seq[2] };
        }
    }

    var parsed_codes = control_seq.reduce(function (parsed_code_acc, code) {
        var parsed_code = parse_basic_control_seq(code);
        if (parsed_code == null) {
            parsed_code = parse_8_16_control_seq(code);
        }
        if (parsed_code == null) {
            console.log("Ignoring control sequence: ");
            console.log(code);
            parsed_code = {};
        }

        // https://stackoverflow.com/a/171256/1291435
        // values are overwritten if keys match
        return Object.assign(parsed_code_acc, parsed_code);
    }, {});

    return parsed_codes;
};
