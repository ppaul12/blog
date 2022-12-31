---
layout: post
title: 可复用强密码生成器
tags: Python3
required: code python
---

# 0. 动机

密码安全不言而喻，然而出于记忆方便的目的个人常常采用固定格式设定密码。尽管一般网络服务都会判断为强密码，但当破译者掌握了用户的部分个人信息以及大致设定规则后，此类设定模式便危如累卵，不堪一击。为此，为了完成2021年秋季学期学校信息安全课的课题，本人设计了一款简单的可复用的强密码生成器。在保证密码强度的前提下主要解决如下问题

- 降低密码与个人信息的关联性
- 确保密码的可再现性
- 提高生成方式的可记忆性

# 1. 原理

大致思路为根据需求构建一张符号表，按照一定的规则从中挑选符号，从而构成密码。

为此准备两个256bit的长整数，一个设为主信息，一个设为副信息。其中主信息负责挑选符号，副信息负责事先扰乱符号表。因此在实际生成的过程中，符号表的每一行会因副信息而扰乱，而我们再从扰乱的每一行中根据主信息挑选符号。这样一来能够大大提高密码的随机性，增大密码强度。

虽然密码的设定并不是十分频繁，但一般在每次登陆时都会涉及输入等问题，因此可再现性也十分重要。为此我们将副信息设为生成时的随机数种子，以确保不同密码的符号表均是不同的。即便某个密码泄露也不至于因符号表而导致满盘皆输。

最后，人为设定256bit的长整数仍然不是一件现实的事情。因此，在此采用了hash算法sha256：从简短的字符串自动生成足够长的整数。也正是在这个阶段引入一些现实世界中的实际信息用来助记。比如可以根据不同的网络服务设定与其对应的副信息，在每次定期更新时更改当前的主信息。由于hash算法的低关联性，即使使用了较为相近的信息也会生成截然不同的长整数。我们便可以设定一些记忆量极低的主/副信息，以提高整体的可记忆性。

# 2. 源码

```python
LOWERCASE_LETTER = 'abcdefghijklmnopqrstuvwxyz'
UPPERCASE_LETTER = LOWERCASE_LETTER.upper()
DIGITS = '0123456789'
SYMBOLS = '`~!@#$%^&*()_+-={}[]\|:;"\'<>,.?/'

def passwordGen(mainInfo: str, subInfo: str, length: int, src: str) -> str:
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
```

# 3. 执行

<py-script src="/assets/src/strong-password-generator/password-gen.py"></py-script>
<py-script>
def buttonClick(event):
    mainInfo = Element('main-info').element.value
    subInfo = Element('sub-info').element.value
    passLen = int(Element('pass-len').element.value)
    digitCheck = Element('digit').element.checked
    symbolCheck = Element('symbol').element.checked
    alphaCheck = Element('alpha').element.checked
    pyscript.write('gen-res', execute(mainInfo, subInfo, passLen, digitCheck, symbolCheck, alphaCheck))
</py-script>
<div>
    <div>主信息：<span><input class="py-input" id="main-info"></span></div>
    <div>副信息：<span><input class="py-input" id="sub-info"></span></div>
    <div>密码长度：<span><input class="py-input" id="pass-len"></span> (4~32可选)</div>
    <div>密码构成：
        <span>数字<input type="checkbox" id="digit" checked></span>
        <span>符号<input type="checkbox" id="symbol" checked></span>
        <span>字母<input type="checkbox" id="alpha" checked></span>
    </div>
    <button id="gen-btn" py-onClick="buttonClick">execute</button>
    <p id="gen-res"></p>
</div>

# 4. 检验

- [PasswordMonster](https://www.passwordmonster.com)
- [Password strength test](https://www.uic.edu/apps/strong-password/)
