---
layout: post
title: 动态内存分配
sub-title: 多维数组
tags: C/C++
required: code math
---

# 1. 数组的内存分布

```c
int main() {
    int array[4];
    printf("array = %p\n", array);
    for (int i = 0; i < 4; i++)
        printf("array[%d] at %p\n", i, &(array[i]));
    return 0;
}
```

```plaintext
array = 0x7ffe691f53f0
array[0] at 0x7ffe691f53f0
array[1] at 0x7ffe691f53f4
array[2] at 0x7ffe691f53f8
array[3] at 0x7ffe691f53fc
```

由上述例子可知，一维数组在内存中连续排布，不间断。而且数组变量名对应的值与数组第一个元素的地址相同，因此可以认为数组变量名为指向该数组第一个元素的指针。

$$
\begin{aligned}
\text{array}\to&\text{array[0] at 0x100}\\
&\text{array[1] at 0x104}\\
&\text{array[2] at 0x108}\\
&\quad\quad\quad\vdots
\end{aligned}
$$

也正因如此一维数组变量可与 `int*` 类型混用。即 `array[i]` 等价于 `*(array + i)`<span id='i'></span>。但仍需注意一维数组的准确类型是 `int[4]` 而非 `int*`。

> `int array[N]`：
> - `array` 的类型：`int[N]`
> - `array` 内容的类型：`int`

```c
int main() {
    int array[4][2];
    printf("array = %p\n", array);
    for (int i = 0; i < 4; i++)
        for (int j = 0; j < 2; j++)
            printf("array[%d][%d] at %p\n", i, j, &(array[i][j]));
    return 0;
}
```

```plaintext
array = 0x7ffe330a2330
array[0][0] at 0x7ffe330a2330
array[0][1] at 0x7ffe330a2334
array[1][0] at 0x7ffe330a2338
array[1][1] at 0x7ffe330a233c
array[2][0] at 0x7ffe330a2340
array[2][1] at 0x7ffe330a2344
array[3][0] at 0x7ffe330a2348
array[3][1] at 0x7ffe330a234c
```

在这个例子中 `array` 为4行2列的二维数组，按照先行后列的方式依次遍历后，可见二维数组仍然在内存中连续排布。

若将一维数组中的指针概念加以融合，在二维数组中 `array[i][j]` 应等价于 `*(*(array + i) + j)`。这里应注意 `array` 作为指针对应的实际数据类型为 `int[2]`，因此 `array` 作为指针的加减是以 `int[2]` 为单位的。那么 `*(array + i)` 在这里获取到的是第i行的行首地址，这个指针的加减才是以 `int` 为单位的。

$$
\begin{aligned}
\text{array}\to&[\text{array[0][0] at 0x100}&\text{array[0][1] at 0x104}]\\
\text{array}+1\to&[\text{array[1][0] at 0x108}&\text{array[1][1] at 0x10c}]\\
&\quad\quad\quad\vdots
\end{aligned}
$$

> `int array[M][N]`：
> - `array` 的类型：`int[M][N]`
> - `array` 内容的类型：`int[N]`

在此利用二维数组的内存连贯性，可以通过强制类型转换实现一些精简的操作。

```c
int main() {
    int array[4][2];
    for (int i = 0; i < 4; i++)
        for (int j = 0; j < 2; j++)
            array[i][j] = 0;
    
    int* p = (int*)array;
    for (int i = 0; i < 4 * 2; i++)
        *(p + i) = 0;
    
    return 0;
}
```

以上两种方式都是对二维数组进行了初始化清零，由于没有依存于行和列的复杂操作，一次循环就显得更加整洁。

更高维度的数组也都是类似的规则，仅以下面的例子作为参考。

```c
int main() {
    int array[2][3][4];
    for (int x = 0; x < 2; x++)
        for (int y = 0; y < 3; y++)
            for (int z = 0; z < 4; z++)
                printf("array[%d][%d][%d] at %p\n", x, y, z, &(array[x][y][z]));
    return 0;
}
```

```plaintext
array[0][0][0] at 0x7ffc7d1a4cb0
array[0][0][1] at 0x7ffc7d1a4cb4
array[0][0][2] at 0x7ffc7d1a4cb8
array[0][0][3] at 0x7ffc7d1a4cbc
array[0][1][0] at 0x7ffc7d1a4cc0
array[0][1][1] at 0x7ffc7d1a4cc4
array[0][1][2] at 0x7ffc7d1a4cc8
array[0][1][3] at 0x7ffc7d1a4ccc
array[0][2][0] at 0x7ffc7d1a4cd0
array[0][2][1] at 0x7ffc7d1a4cd4
array[0][2][2] at 0x7ffc7d1a4cd8
array[0][2][3] at 0x7ffc7d1a4cdc
array[1][0][0] at 0x7ffc7d1a4ce0
array[1][0][1] at 0x7ffc7d1a4ce4
array[1][0][2] at 0x7ffc7d1a4ce8
array[1][0][3] at 0x7ffc7d1a4cec
array[1][1][0] at 0x7ffc7d1a4cf0
array[1][1][1] at 0x7ffc7d1a4cf4
array[1][1][2] at 0x7ffc7d1a4cf8
array[1][1][3] at 0x7ffc7d1a4cfc
array[1][2][0] at 0x7ffc7d1a4d00
array[1][2][1] at 0x7ffc7d1a4d04
array[1][2][2] at 0x7ffc7d1a4d08
array[1][2][3] at 0x7ffc7d1a4d0c
```

# 2. 多维数组类型判断

在学习数组的过程中，数组指针、指针数组之类的概念时常出现，且极易混淆。比如

- `int (*p1)[4]`
- `int* p2[4]`

其中 `p1` 代表的是上述的数组指针，`p2` 则代表的是指针数组。但事实上此两者属于完全不同范畴下的名称。数组指针重点在于指针，指的是指向数组的指针。相反指针数组重点在于数组，指的是内容有些特殊的数组。因为C语言中指针也属于一种数据，所以存储指针数据的数组是理论可行的。但不论如何，以上的混乱皆来自于未能透过现象看本质，诱因可归结为对复杂数组类型判断的问题上。

## 2.1 判断方式

变量名类型：原式中去掉变量名后剩余的部分

若变量名类型为数组，则

存储内容类型：原式中去掉变量名以及最近 `[.]` 后剩余的部分

若变量名类型为指针，则

指针指向内容的类型：原式中去掉变量名以及 `*` 后剩余的部分

> 注：在C语言中 `[.]` 的优先级高于 `*`，所以应先判断是否为数组

## 2.2 小试牛刀

1. `int a[3]`
    - a 的类型：`int[3]`，一个存有3个元素的整形数组
    - a 存储内容的类型：`int`，整形

2. `int a[2][3]`
    - a 的类型：`int[2][3]`，一个2行3列的数组
    - a 存储内容的类型：`int[3]`，一个存有3个元素的整形数组

3. `int (*a)[3]`
    - a 的类型：`int(*)[3]`，指针
    - a 指向内容的类型：`int[3]`，一个存有3个元素的整形数组
    - a 的完整描述：一个指向 存有3个元素的整形数组 的指针

4. `int *(*a)[3]` = `int* (*a)[3]`
    - a 的类型：`int*(*)[3]`，指针
    - a 指向内容的类型：`int*[3]`，一个存有3个元素的整形指针数组
    - a 的完整描述：一个指向 存有3个元素的整形指针数组 的指针

5. `int (*a[2])[3]`
    - a 的类型：`int(*[2])[3]`，一个存有2个元素的数组
    - a 存储内容的类型：`int(*)[3]`，指针
    - 上述指针指向的类型：`int[3]`，一个存有3个元素的整形数组
    - a 的完整描述：一个存有2个 指向 存有3个元素的整形数组 的指针 的数组

想必到此为止数组指针、指针数组的概念就不会成为困扰了。

此外，根据[第一节](#1-数组的内存分布)的内容可知，一级指针可以视作不定长的一维数组，所以上述例子含有指针的部分都可以进行类似于多维数组的改写。

- `int (*a)[3]` $\iff$ `int a[n][3]`
- `int*1 (*2a)[3]` $\iff$ `int*1 a[n2][3]` $\iff$ `int a[n2][3][n1]`
- `int (*a[2])[3]` $\iff$ `int a[2][n][3]`

# 3. 动态内存分配方式

## 3.1 间断内存分配

在一般动态初始化多维数组时，如下的方式极其常见。

```c
int** a = (int**)malloc(2 * sizeof(int*)); // 2 为行数
for (int i = 0; i < 2; i++)
    a[i] = (int*)malloc(3 * sizeof(int)); // 3 为列数
```

这样的分配方式十分符合直觉，先确定行，再分配列。但经验证可知，此时“2维数组” a 在内存空间中是分散的。

```c
for (int i = 0; i < 2; i++) {
        printf("a[%d] at %p\n", i, &(a[i]));
        for (int j = 0; j < 3; j++)
            printf("a[%d][%d] at %p\n", i, j, &(a[i][j]));
    }
```

```plaintext
a[0] at 0x56280abf12a0
a[0][0] at 0x56280abf12c0
a[0][1] at 0x56280abf12c4
a[0][2] at 0x56280abf12c8
a[1] at 0x56280abf12a8
a[1][0] at 0x56280abf12e0
a[1][1] at 0x56280abf12e4
a[1][2] at 0x56280abf12e8
```

因此在主动释放内存时就需要重复和分配时类似的动作，先释放每一行，再释放行地址的数组。

```c
for (int i = 0; i < 2; i++)
    free(a[i]);
free(a);
```

由此可见，这样的分配方式不仅分配、释放时费时费力，而且同样存储 `row * col` 各元素就会占据 `row * sizeof(int*) + row * col * sizeof(int)` 的空间。此外，在 GPU 编程时由于内存分配不连续，也会导致数据转移变得十分复杂。

## 3.2 连续内存分配

C语言标准库 `stdlib.h` 中的 `malloc` 函数会默认分配指定长的连续内存，返回值为默认为 `void*` 指针。由于强制类型转换时不允许明示为数组类型，即

```c
int a[2][3] = (int[2][3])malloc(sizeof(int[2][3]));
// error: cast specifies array type
```

所以多维数组的连续内存分配的重点在于准确的类型转换。

因此上述例子应改写为，

```c
int (*a)[3] = (int(*)[3])malloc(sizeof(int[2][3]));
```

尽管列数3仍然出现在了类型转换的描述中，但整个描述最终落在了指针上，所以是合法的表述形式。

```c
int main() {
    int (*a)[3] = (int(*)[3])malloc(2 * 3 * sizeof(int));
    for (int i = 0; i < 2; i++)
        for (int j = 0; j < 3; j++)
            printf("a[%d][%d] at %p\n", i, j, &(a[i][j]));
    free(a);
    return 0;
}
```

```plaintext
a[0][0] at 0x556e9bd642a0
a[0][1] at 0x556e9bd642a4
a[0][2] at 0x556e9bd642a8
a[1][0] at 0x556e9bd642ac
a[1][1] at 0x556e9bd642b0
a[1][2] at 0x556e9bd642b4
```

此时应注意指针的使用。在上述验证中，若将 `i < 2` 误写成 `i < 3` 再执行也不会出现报错。但显然本程序片段并没有得到 `a[2][0 ~ 2]` 所对应内存空间的完整使用权。也就是说，可以通过指针访问到该地址的数据，但却无法保证该地址上的数据不会被其他程序片段修改。

同时也应注意不能图省事将 `int (*a)[3]` 和 `int(*)[3]` 简写为 `int**`，不然在后续 `a[i][j]` 访问时程序无法确定第一部分的增量。

最后本小节中出现的技巧也可用于以高维数组的方式访问低维数组。

```c
int main() {
    int a[2 * 3] = {1, 2, 3, 4, 5, 6};
    int (*b)[3] = (int(*)[3])a;
    for (int i = 0; i < 2; i++)
        for (int j = 0; j < 3; j++)
            printf("b[%d][%d] = %d\n", i, j, b[i][j]);
    return 0;
}
```
