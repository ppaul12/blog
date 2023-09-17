---
layout: post
title: λ计算memo
tags: ComputerScience
required: math code
---

- toc
{:toc}

TL;DR

# 构文

## 定义

$$
M::=x|\underbrace{\lambda x.M}_{\lambda-abstraction}|\underbrace{M_1M_2}_{application}
$$

## $\alpha$等价

### 绑定变量

- $BV(x)=\emptyset$
- $BV(\lambda x.M)=BV(M)\cup\{x\}$
- $BV(M_1M_2)=BV(M_1)\cup BV(M_2)$

### 自由变量

- $FV(x)=\{x\}$
- $FV(\lambda x.M)=FV(M)-\{x\}$
- $FV(M_1M_2)=FV(M_1)\cup FV(M_2)$

### $\alpha-equivalence$

- $\cfrac{y\not\in FV(M)}{\lambda x.M\equiv_\alpha\lambda y.\{y/x\}M}$
- $\cfrac{M\equiv_\alpha N}{C[M]\equiv_\alpha C[N]}$
- $\cfrac{}{M\equiv_\alpha M}$
- $\cfrac{M^\prime\equiv_\alpha M}{M\equiv_\alpha M^\prime}$
- $\cfrac{M\equiv_\alpha M^{\prime\prime}\quad M^{\prime\prime}\equiv_\alpha M^\prime}{M\equiv_\alpha M^\prime}$

## $\beta$代入

## $\eta$化简

$$
(\lambda x.Mx)N\to_\beta MN
\implies
C[\lambda x.Mx]\equiv_\eta C[M]\quad(x\not\in FV(M))
$$

# 基本数据类型

## 布尔值

- $\lceil\text{true}\rceil\triangleq\lambda a.\lambda b. a$
- $\lceil\text{false}\rceil\triangleq\lambda a.\lambda b.b$

### if语句

- $\text{if }\lceil\text{true}\rceil\text{ then }e_1\text{ else }e_2=(\lambda a.\lambda b. a)e_1e_2\to^\ast e_1$
- $\text{if }\lceil\text{false}\rceil\text{ then }e_1\text{ else }e_2=(\lambda a.\lambda b. b)e_1e_2\to^\ast e_2$

### 逻辑算子

- $\lceil\text{and}\rceil\triangleq\lambda b_1.\lambda b_2.b_1b_2\lceil\text{false}\rceil$
- $\lceil\text{or}\rceil\triangleq\lambda b_1.\lambda b_2.b_1\lceil\text{true}\rceil b_2$
- $\lceil\text{not}\rceil\triangleq\lambda b.b\lceil\text{false}\rceil\lceil\text{true}\rceil$

## 组 (tuple)

- $\lceil\text{pair}\rceil\triangleq\lambda a.\lambda b.\lambda f.fab$：以$\lceil\text{pair}\rceil\lceil a\rceil\lceil b\rceil$的方式构建一个组，通过返回$\lambda f.fab$的方式，让a与b处于可操作状态
- $\lceil\text{fst}\rceil\triangleq\lambda p.p(\lambda a.\lambda b.a)$
- $\lceil\text{snd}\rceil\triangleq\lambda p.p(\lambda a.\lambda b.b)$

## 自然数

$$
\lceil n\rceil\triangleq\lambda s.\lambda z.\underbrace{s(s(\cdots s}_{n}(z)))
$$

- 本质为对某一输入z做n次s的操作。
- $\lceil0\rceil=\lambda s.\lambda z.z$
- $\lceil1\rceil=\lambda s.\lambda z.sz$

### 常用运算

- $\lceil\text{isZero}\rceil\triangleq\lambda n.n(\lambda b.\lceil\text{false}\rceil)\lceil\text{true}\rceil$：s为$\lambda b.\lceil\text{false}\rceil$,z为$\lceil\text{true}\rceil$。尝试对z做n次s的操作，若为0则无法重复直接返回$\lceil\text{true}\rceil$。
- $\lceil\text{lessEqual}\rceil\triangleq\lambda m.\lambda n.\lceil\text{isZero}\rceil(\lceil\text{minus}\rceil mn)$
- $\lceil\text{less}\rceil\triangleq\lambda m.\lambda n.\lceil\text{not}\rceil(\lceil\text{lessEqual}\rceil nm)$：基于$\lnot(n\le m)\implies m<n$可得
- $\lceil\text{equal}\rceil\triangleq\lambda m.\lambda n.\lceil\text{and}\rceil(\lceil\text{lessEqual}\rceil mn)(\lceil\text{lessEqual}\rceil nm)$：基于$m\le n\land n\le m\implies m=n$可得
- $\lceil\text{succ}\rceil\triangleq\lambda m\lambda s.\lambda z.s(msz)$
- $\lceil\text{plus}\rceil\triangleq\lambda m.\lambda n.\lambda s.\lambda z.ms(nsz)$：定义中$\lambda s.\lambda z$的部分为自然数的头部，相当于一个包装。最后$nsz$的部分实为拆掉n的头部，使其作为z参与后续运算。即整体为对n的主体进行m次s的操作，也就是为n的主体添加m个s。
- $\lceil\text{mult}\rceil\triangleq\lambda m.\lambda n.n(\lceil\text{plus}\rceil m)\lceil0\rceil$：将$\lceil\text{plus}\rceil m$的部分理解为加法运算的部分代入，做$+m$的操作。整体即为对0做n次加m的运算。此外乘法也可做如下定义$\lceil\text{mult}\rceil\triangleq\lambda m.\lambda n.\lambda s.n(ms)$，脱离实际代数运算的思考方式，单纯着重于形式的构造。
- $\lceil\text{exp}\rceil\triangleq\lambda m.\lambda n.n(\lceil\text{mult}\rceil m)\lceil1\rceil$：理解方式同上。此外幂运算同样也可做如下定义$\lceil\text{exp}\rceil\triangleq\lambda m.\lambda n.nm$。

### predecessor

$$
\text{pred}(n)=\begin{cases}
0\quad n=0\\
m\quad n=m+1
\end{cases}
$$

通过构建相邻两数的组的方式定义pred函数。即$(0,0)\to(0,1)\to(1,2)\to\cdots\to(n-1,n)$，取第n组的首个元素即可得到$\text{pred}(n)$。粗略定义如下

$$
\lceil\text{pred}\rceil\triangleq
\lambda n.\lceil{fst}\rceil\{n\ [\lambda(x,y).(y,y+1)]\ (0,0)\}
$$

具体定义如下

$$
\lceil\text{pred}\rceil\triangleq
\lambda n.\lceil\text{fst}\rceil\{n\ 
[\lambda p.\lceil\text{pair}\rceil\ (\lceil\text{snd}\rceil p)\ (\lceil\text{plus}\rceil(\lceil\text{snd}\rceil p)\lceil1\rceil)]
\ (\lceil\text{pair}\rceil\lceil0\rceil\lceil0\rceil)\}
$$

### 减法

$$
\text{minus}=\begin{cases}
0\quad m\le n\\
m-n\quad m>n
\end{cases}
$$

对输入m执行n次前继运算即可。具体定义如下

$$
\lceil\text{minus}\rceil\triangleq\lambda m.\lambda n.n\lceil\text{pred}\rceil m
$$

# 递归以及不动点

## 不动点

$$
\text{fix}_F=(\lambda x.(F x x))(\lambda x.(F x x))
$$

此处x无实意，仅仅为了代表同样的运算子。化简不动点可发现

$$
\text{fix}_F\to_\beta F((\lambda x.(F x x))(\lambda x.(F x x)))=F(\text{fix}_F)
$$

无论对不动点做多少次F这个操作都不会发生变化，因而称$\text{fix}_F$为F的不动点。

## 不动点算子

$$
Y\triangleq\lambda F.\text{fix}_F=\lambda F.(\lambda x.(F x x))(\lambda x.(F x x))
$$

即通过调用$YF$可得F的不动点，$YF\equiv_\beta F(YF)$。例如阶乘函数可写为

$$
\text{fact}\triangleq Y(\lambda f.\lambda n.\text{if }n=0\text{ then }1\text{ else }n\times f(n - 1))
$$

其中$\lambda n.\text{if }n=0\text{ then }1\text{ else }n\times f(n - 1)$的部分为实际的运算主体，f可看作实际的递归函数，那么使用不动点算子构造递归函数的一般形式可写为

$$
\text{Function}\triangleq Y(\lambda\text{ iterFunc}.\{\text{iterFunc body}\})
$$

# 列表

## 基本内容

$$
[1,2,3]\to\text{cons}(1,\text{cons}(2,\text{cons}(3,\text{nil})))
$$

- $\lceil\text{cons}\rceil\triangleq\lceil\text{pair}\rceil=\lambda a.\lambda b.\lambda f.fab$
- $\lceil\text{head}\rceil\triangleq\lambda p.p(\lambda a.\lambda b.a)$
- $\lceil\text{tail}\rceil\triangleq\lambda p.p(\lambda a.\lambda b.b)$
- $\lceil\text{nil}\rceil\triangleq\lambda f.\lceil\text{true}\rceil$：与构造完毕的pair保持同样的结构，区别在于Nil无论得到什么操作都只会返回true。
- $\lceil\text{isNil}\rceil\triangleq\lambda p.p(\lambda a.\lambda b.\lceil\text{false}\rceil)$：对一个构造完毕的pair结构传入能够读取两个元素的函数。如果该pair为Nil则不会有任何效果直接返回true，相反如果该pair有元素即非Nil则会返回false。

## 复杂操作

附OCaml参考代码

<script src="https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets/languages/ocaml.min.js"></script>

### concat

$$
\lceil\text{CAT}\rceil\triangleq Y(
\lambda\text{cat}.\lambda a.\lambda b.(\lceil\text{isNil}\rceil a)\ b\ (
\lceil\text{pair}\rceil\ (\lceil\text{head}\rceil a)\ (\text{cat}(\lceil\text{tail}\rceil a)b)))
$$

```ocaml
let rec concat a b =
    match a with
    | [] -> b
    | head :: tail -> head :: (concat tail b)
```

### length

$$
\lceil\text{LEN}\rceil\triangleq Y(
\lambda\text{len}.\lambda c.\lambda\text{lst}(\lceil\text{isNil}\rceil\text{lst})\ c\ (
\text{len}\ (\lceil\text{succ}\rceil c)\ (\lceil\text{tail}\rceil\text{lst})))\lceil0\rceil
$$

```ocaml
let rec len counter lst =
    match lst with
    | [] -> counter
    | head :: tail -> len (counter + 1) tail
in len 0
```

### reverse

$$
\lceil\text{REV}\rceil\triangleq Y(
\lambda r.\lambda a.\lambda l.(\lceil\text{isNil}\rceil l)\ a\ (
r\ (\lceil\text{pair}\rceil\ (\lceil\text{head}\rceil l)\ a)\ (\lceil\text{tail}\rceil l)))\text{nil}
$$

```ocaml
let rec rev aux lst =
    match lst with
    | [] -> aux
    | head :: tail -> rev (head :: aux) tail
in rev []
```

### map

$$
\lceil\text{MAP}\rceil\triangleq Y(
\lambda\text{map}.\lambda f.\lambda\text{lst}.
(\lceil\text{isNil}\rceil\text{lst})\ \text{nil}\ (
\lceil\text{pair}\rceil\ (f(\lceil\text{head}\rceil\text{lst}))\ (
\text{map}f(\lceil\text{tail}\rceil\text{lst}))))
$$

```ocaml
let rec map f lst =
    match lst with
    | [] -> []
    | head :: tail -> (f head) :: (map f tail)
```

### filter

$$
\lceil\text{FILTER}\rceil\triangleq Y(
\lambda f.\lambda b.\lambda l.(\lceil\text{isNil}\rceil l)\ \text{nil}\ (
(b(\lceil\text{head}\rceil l)\ (\lceil\text{pair}\rceil\ (\lceil\text{head}\rceil l)\ (f b (\lceil\text{tail}\rceil l)))
\ (f b (\lceil\text{tail}\rceil l)))))
$$

```ocaml
let rec filter b lst =
    match lst with
    | [] -> []
    | head :: tail ->
        if b head then
            head :: (filter b tail)
        else
            (filter b tail)
```

### ...

# 在线工具

- [λ Calculus Interpreter](https://jacksongl.github.io/files/demo/lambda/index.htm)
- [Lambda Calculus Calculator](https://lambdacalc.io)

# 参考资料

- [Collected Lambda Calculus Functions](https://jwodder.freeshell.org/lambda.html)
- [プログラム意味論の基礎](https://www.amazon.co.jp/プログラム意味論の基礎-ライブラリ情報学コア・テキスト-11-小林-直樹/dp/4781914837)
