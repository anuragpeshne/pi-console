const ESCAPE_CODES = {
    "\u0008": "backspace",
    "\u001b": "escape"
};

function parse_escape_code(string) {
    var output = [];
    const FA_STATES = ['ESC', 'LBRACK',];
    var state;
    for (char in string) {
        if (char in ESCAPE_CODES) {
            switch (ESCAPE_CODES[char]) {
            case "escape":
                // check next character
                break;
            case "backspace":
                output.pop();
                break;
            }
        }
    }
}
