/**
 * Type of tokens. Pretty self-explantory. Note: all symbols like ! or $ are counted as CHAR
 */
export type TokenType =
  | "CHAR"
  | "DOT"
  | "STAR"
  | "PLUS"
  | "QUESTION"
  | "LPAREN"
  | "RPAREN"
  | "LBRACE"
  | "RBRACE"
  | "LBRACKET"
  | "RBRACKET"
  | "ALT"         
  | "ANCHOR_START" 
  | "ANCHOR_END"  
  | "NUMBER"
  | "COMMA"
  | "ESCAPE"
  | "EOF";


/**
 * Token represents one single token for the lexical analyzer.
 * type: the type of token as defined above
 * value: the value of the token in the given string
 * position: index of the occurrence of the token.
 */
export interface Token {
    type: TokenType; 
    value: string;
    position: number;
}