enum TokenType {
    STR, WHITESPACE, NEWLINE,
    H1, H2, H3, H4, H5, H6,
    EQ, PLUS, SEMICOLON, BANG, PIPE,
    MINUS, LONG_MINUS,
    ASTERISKS, UNDERSCORE,
    DOUBLE_ASTERISKS, DOUBLE_UNDERSCORE, DOUBLE_TILDE,
    LIST_NUMBER,
    LT, GT,
    LEFT_SQ_PAR, RIGHT_SQ_PAR,
    LEFT_PAR, RIGHT_PAR,
    BACKTICK, TRIPLE_BACKTICK
}

export default TokenType;
