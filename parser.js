// referred: https://misc.flogisoft.com/bash/tip_colors_and_formatting

const CONTROL_SEQ_256_LIST = require('./xtermcolors.json');

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
    var pos = (typeof(pos) !== 'undefined') ? pos : 0;
    var output = [];
    var current_style = {};
    var buffer = '';
    while (pos < input.length) {
        if (input[pos] in ESCAPE_CODES) {
            switch (ESCAPE_CODES[input[pos]]) {
            case "escape":
                // check next character
                if ((pos + 1) < input.length) {
                    if (input[pos + 1] == '[') {
                        pos += 2; // we have parsed until '['
                        var escape_chars_end = pos;
                        while (escape_chars_end < input.length && input[escape_chars_end] != 'm') {
                            escape_chars_end++;
                        }
                        if (escape_chars_end < input.length) {
                            var parsed_style = exports.parse_escape_code(input.substring(pos, escape_chars_end));
                            if (buffer.length > 0) {
                                output.push({ "value": buffer, "style": current_style });
                                buffer = '';
                            }
                            current_style = parsed_style;
                            pos = escape_chars_end + 1;
                        }
                    }
                }
                break;
            case "backspace":
                output.pop();
                break;
            default:
                console.log("Unimplemented escape code:" + input[pos]);
            }
        } else if (input[pos] == '\n'){
            pos++;
            output.push({ "value": buffer, "style": current_style});
            buffer = '';
            output.push({ "value": "\n" });
        } else {
            // `concat` over `join`: https://stackoverflow.com/a/27126355/1291435
            buffer += input[pos];
            pos++;
        }
    }
    if (buffer.length > 0) {
        output.push({ "value": buffer, "style": current_style });
    }
    return output;
};

exports.parse_escape_code = function (input) {
    var control_seq = input.split(';').map(function(e) { return parseInt(e); });
    if (control_seq.length == 3) {
        if (control_seq[0] == 38 && control_seq[1] == 5) {
            // 256 colors foreground
            return { "fg": get_256_color_code(control_seq[2]) };
        } else if (control_seq[0] == 48 && control_seq[1] == 5) {
            // 256 colors background
            return { "bg": get_256_color_code(control_seq[2]) };
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

        return merge_text_prop_obj(parsed_code_acc, parsed_code);
    }, {});

    return parsed_codes;
};

function to_HTML(json_code) {
    var HTML_lines = [];
    for (var i = 0; i < json_code.length; i++) {
        var json_line = json_code[i];

    }
}

function get_256_color_code(input_colorId) {
    if (input_colorId >= 0 && input_colorId <= 255) {
        var color = CONTROL_SEQ_256_LIST.filter(function(color) {
            return color['colorId'] == input_colorId;
        });
        return color[0]['hexString'];
    } else {
        return '#aaaaaa';
    }
}

function merge_text_prop_obj(obj1, obj2) {
    // this is a specific purpose object merge function
    // if key is 'style' then keep both else keep obj2 property
    var retObj = obj1;
    for (key in obj2) {
        if (key in obj1 && key == 'style') {
            retObj['style'] = obj1['style'] + ', ' + obj2['style'];
        } else {
            retObj[key] = obj2[key];
        }
    }
    return retObj;
}
