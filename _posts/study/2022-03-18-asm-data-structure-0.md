---
layout: post
title: 数据结构的汇编实现 (0)
tags: 数据结构 Assembly C/C++
required: code
---

# 动机

Just for fun.

# 环境

本系列内容将使用RISC-V的汇编语言完成，测试环境为个人开发的[RV32I模拟器](https://github.com/{{ site.thirdparty.github.user }}/RV32I-simulator)。其中汇编器部分的设计思路可参考[对应博文]({% post_url study/2022-02-07-how-to-build-an-assembler %})。

[![](https://github-readme-stats.vercel.app/api/pin/?username={{ site.thirdparty.github.user }}&repo=RV32I-simulator&show_owner=true)](https://github.com/{{ site.thirdparty.github.user }}/RV32I-simulator)

# 用法

## 克隆项目仓库

```shell
$ git clone https://github.com/{{ site.thirdparty.github.user }}/RV32I-simulator
```

通过以上代码克隆项目仓库，阅读根目录下的README做好相关库与python版本的准备。

## 汇编RV32I的代码

进入`/asm`目录，按以下方式执行汇编流程

```shell
$ cd asm
$ python3 asm.py test-codes/fib.s
```

此后`fib.s`对应的二进制文件将会出现在根目录的`/bin`文件夹里。其他汇编选项可通过`python3 asm.py -h`查看。

## 模拟器执行

回到根目录，编译模拟器后，将上一步生成的二进制文件作为唯一参数运行可执行文件。

```shell
$ make
$ ./sim bin/fib.bin
```

GUI模式下的使用方法可通过输入`help`查看。

# 正文

1. [列表操作]({% post_url study/2022-03-19-asm-data-structure-1 %})
1. [顺序表]({% post_url study/2022-03-21-asm-data-structure-2 %})
1. [单链表]({% post_url study/2022-03-27-asm-data-structure-3 %})

# 小结

实际操控每一寸存储空间的掌控感值得体验一番。

# 参考链接

- [x86 Disassembly: Data Structures](https://en.m.wikibooks.org/wiki/X86_Disassembly/Data_Structures)
- [University of Washington: Data Structures in Assembly](https://courses.cs.washington.edu/courses/cse351/13su/lectures/12-structs.pdf)
- [数据结构与算法 Python语言描述](https://book.douban.com/subject/26702568/)
