import random, hashlib
from collections import deque

LOWERCASE_LETTER = 'abcdefghijklmnopqrstuvwxyz'
UPPERCASE_LETTER = LOWERCASE_LETTER.upper()
DIGITS = '0123456789'
SYMBOLS = '`~!@#$%^&*()_+-={}[]\|:;"\'<>,.?/'

def generate(mainInfo: str, subInfo: str, length: int, src: str) -> str:
    hashMain = hashlib.sha256(mainInfo.encode()).digest()
    hashSub = hashlib.sha256(subInfo.encode()).digest()
    # set random seed with subInfo and  shuffle the provided source
    random.seed(hashSub)
    src = list(src)
    random.shuffle(src)
    # build source table
    table = list()
    for idx in range(length):
        table.append(deque(src))
        # rotate each row basing on subInfo
        table[idx].rotate(hashSub[idx])
    # select certain table elements basing on mainInfo
    password = ''.join(table[idx][hashMain[idx] % len(src)] for idx in range(length))
    return password

def execute(mainInfo: str, subInfo: str, passLen: int, digitCheck: bool, symbolCheck: bool, alphaCheck: bool) -> str:
    src = ''
    src += DIGITS if digitCheck else ''
    src += SYMBOLS if symbolCheck else ''
    src += (LOWERCASE_LETTER + UPPERCASE_LETTER) if alphaCheck else ''
    if not src: return '生成失败(需选择至少一项密码构成)'
    if not (4 <= passLen <= 32): return '生成失败(密码长度应介于4至32之间)'
    return f'生成完毕: {generate(mainInfo, subInfo, passLen, src)}'
