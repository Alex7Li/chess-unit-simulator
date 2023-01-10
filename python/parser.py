import lark

from lark import Lark

# https://www.lark-parser.org/ide/
with open('syntax.lark') as f:
    parser = Lark("\n".join(f.readlines()))

print(parser.parse("Hello, World!") )
