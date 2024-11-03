---
layout: post
title: 抽象基类与泛型
subtitle: Python语言实现
tags: 程序语言 Python3
required: code
---

# 语言类型

程序语言一般从两个角度约束变量的类型：一为动态与静态，一为强弱。

> - 动态类型：值决定类型
> - 静态类型：声明决定类型
{: .info}

诚然存在基于变量类型确定的时机(运行时或编译时)定义动态类型和静态类型的角度，但不需要编译的解释型语言仍旧可以从语言层面加以限定。尽管如此，随着类型推断(type inference)的普及，一些静态类型语言也无需显式书写类型，如Ocaml等。

> - 强类型：必须显式转换类型
> - 弱类型：允许隐式转换类型
{: .info}

对于常见语言可做以下分类，但也不得不注意动静、强弱本身均属于相对的概念，并且也不存在100%精确的定义进行区分，所以把握大意即可。

| |动态类型|静态类型|
|:-:|:-:|:-:|
|强类型|Python|Java|
|弱类型|JavaScript|C/C++|
{: caption="常见语言的分类"}

# 抽象基类与泛型

泛型(generic)一般被视作程序设计语言的高级技巧，不同语言中存在诸多不同名的同类概念，如模版(template)、参数多态(parametric polymorphism)等，其旨在提高类型安全性和代码复用程度。

抽象基类(abstract base class)，即抽象类和基类的组合词。其限制在于无法实例化，只能用于继承，并且派生的类必须实现基类中的所有抽象方法。好处在于通过不可实例化的基类可以确定子类的通性。

在此，简单区分和抽象类相似的概念：协议(protocal)或是接口(interface)。二者均能规范类的行为模式，但抽象类更多地强调“is-a”的关系，是一种泛化。相反，协议目的在于抽象共通的行为模式，类似于“has-a”或是“like-a”的关系。

在Python3中，可以使用`abc`和`typing`实现抽象基类和泛型的结合。

# Python3实现

在此实现拥有共通方法的队列和栈。

```python
import abc
from typing import Iterable, Optional

class Container[T](abc.ABC):
    def __init__(self, data: Optional[Iterable[T]]=None) -> None:
        self.data: list[T] = []

        if not data: return
        for item in data:
            self.push(item)

    @abc.abstractmethod
    def push(self, item: T) -> None:
        pass

    @abc.abstractmethod
    def pop(self) -> Optional[T]:
        pass

    def __len__(self) -> int:
        return len(self.data)
```
{: .line-numbers}

首先基于队列和栈所共同拥有的方法构建基类。其中`__len__`的行为是统一的，所以直接实现即可。`push`和`pop`为区别所在，因此保留为抽象方法。

```python
class Queue[T](Container):
    def push(self, item: T) -> None:
        return self.data.append(item)

    def pop(self) -> Optional[T]:
        return self.data.pop(0) if self.data else None

class Stack[T](Container):
    def push(self, item: T) -> None:
        return self.data.append(item)

    def pop(self) -> Optional[T]:
        return self.data.pop() if self.data else None
```
{: .line-numbers}

分别具体实现队列和栈，至此仍将容器的内容保留为类型变量`T`，倘若`Container`的子类未实现所有抽象方法则会收到来自于类型检查器的报错，这便是抽象基类的作用。

```python
stack = Stack[int]()
stack.push(1) # legal, no error
stack.push('a') # "Literal['a']" is incompatible with "int"

queue = Queue[str](['a', 'b', 'c'])
queue.pop() # return value will be marked as "str"
queue.push(1) # "Literal[1]" is incompatible with "str"
```
{: .line-numbers}

分别实现内容为`int`的栈和内容为`str`的队列，类型变量`T`则会被具像化为对应的类型，倘若函数参数类型不符也会报错，泛型得以发挥作用。

仍需注意，Python3中类型标注仅服务于静态类型检查，不会影响实际运行。所以，通过类型标注将程序写成类似静态类型语言的样子也只是为了更好的代码提示，减少开发时意外的类型错误罢了。
