---
layout: post
title: 多人出行记账工具
tags: APP Python3
required: code
---

- toc
{:toc}

# 制作动机

不久前利用些许时间研究了 GitPages + jekyll 的使用方式，基于 jekyll-dash 这个主题制作了属于自己的主页（即本站），想着应尽早写一篇编程相关的内容以步入正轨。正巧在下周我将和三位大学朋友一同出行，由于人数较多、各自在筹备过程中都负责了不同的内容，即使在旅行途中也势必会涉及大量的 “钱款转移” 问题，所以借这个机会设计了这个小工具。

> Why [Pythonista3](http://omz-software.com/pythonista/)?
>
> Pythonista3 是一款发行于 iOS 和 iPadOS 上的完整版 Python IDE。语言本身功能完整，特殊定制化的内容也极其丰富，可以快速设计出带有 GUI 的软件或者游戏。比起使用 Swift 去建立项目开发，Pythonista3 更加方便快捷。

接下来进入正题。

# GUI

出于开发目的，工具的界面上应该展示出到目前为止的所有款项以及能够新增条目的区域。尽管对于一个有数据管理需求的工具来讲，增删改查应当尽可能的面面俱到，但为了开发的便利这次就只设计了完备的 “增” 和 “查” 的部分，“删” 计划由即时执行用户输入的代码实现，“改” 则由 “删” + “增” 替代。实际效果如下。

<div class="img-frame"><img src="/assets/src/split-the-bill/GUI.jpeg" style="height: 200px;"></div>

## 基本框架

在组织构成角度，我大体遵循了中介模式（mediator），将控制整体布局的 `ViewController` 定为核心，一切其他模块均由此做关联。首先完成核心部分的初始化。

```python
class ViewController(object):
	
	def __init__(self):
		self.mainView = ui.ScrollView(
            frame=(0, 0, 320, 320),
            background_color='white')

        self.presentSection = PresentSection(frame=(10, 30, 300, 0), controller=self)
        self.editSection = EditSection(frame=(10, 0, 300, 30), controller=self)
        self.codeSection = CodeSection(frame=(10, 0, 300, 30), controller=self)

        self.mainView.add_subview(ui.Label(
            frame=(10, 5, 300, 20),
            flex='LR',
            text='Split the bill',
            font=('<system-bold>', 18),
            alignment=ui.ALIGN_CENTER))
        self.mainView.add_subview(self.presentSection.mainView)
        self.mainView.add_subview(self.editSection.mainView)
        self.mainView.add_subview(self.codeSection.mainView)
        self.mainView.right_button_items = [
            ui.ButtonItem(title='Exec', action=None),
            ui.ButtonItem(title='Reset', action=None, tint_color='red')]
```

因为条目展示部分的大小会随着内容多少而发生变化，为此我将主画面初始化成了 `ScrollView`。虽然只将展示部分做此设定会更加简单，这里主要是想练习一下动态调整控件位置的技巧。因此，在第8行处 presentSection 的 height 值和第9、10行处 editSection、 codeSection 的 y 值只做了随意设定。以下是上述三个 Section 的具体初始化代码。

```python
class PresentSection(object):

    def __init__(self, frame, controller):
        self.controller = controller
        self.mainView = ui.View(frame=frame, flex='LR')

class EditSection(object):

    def __init__(self, frame, controller):
        self.controller = controller

        self.mainView = ui.View(frame=frame, flex='LR')
        self.mainView.add_subview(ui.TextField(
            name='name',
            frame=(5, 0, 160, 30),
            placeholder='name',
            autocapitalization_type=ui.AUTOCAPITALIZE_NONE,
            clear_button_mode='while_editing'))
        self.mainView.add_subview(ui.TextField(
            frame=(175, 0, 90, 30),
            name='cost',
            placeholder='cost',
            keyboard_type=ui.KEYBOARD_NUMBER_PAD))
        self.mainView.add_subview(ui.Button(
            frame=(273, 3, 24, 24),
            name='submit',
            action=None,
            background_image=ui.Image.named('iob:checkmark_circled_256')))

class CodeSection(object):

    def __init__(self, frame, controller):
        self.controller = controller

        self.mainView = ui.View(frame=frame, flex='LR')
        self.mainView.add_subview(ui.TextField(
            frame=(5, 0, 230, 30),
            name='code',
            placeholder='code: use database as db',
            autocapitalization_type=ui.AUTOCAPITALIZE_NONE,
            clear_button_mode='while_editing'))
        self.mainView.add_subview(ui.Button(
            frame=(238, 3, 24, 24),
            name='snippet',
            action=None,
            background_image=ui.Image.named('iob:clipboard_256')))
        self.mainView.add_subview(ui.Button(
            frame=(273, 3, 24, 24),
            name='submit',
            action=None,
            background_image=ui.Image.named('iob:play_256')))
```

在控件初始化代码中所有的外围容器的 `flex` 属性都设为了 `'LR'`，以此保证了该控件的左右边距会随着屏幕尺寸动态调整，不至于当尺寸过大时都挤在一边。

随后在 `ViewController` 中加入 `run` 函数以实现对界面运行代码的封装。

```python
class ViewController(object):
    ...
    def run(self):
        self.mainView.present('sheet')

if __name__ == '__main__':
    ViewController().run()
```

但此时运行程序的话，由于并没有实际调整可变控件的具体位置，我们大概率会看到堆挤在顶部的混乱场景。

> Tips: 直接继承 `ui.View` 类或许也是个不错的选择

## 中介函数

```python
class ViewController(object):
    
    def __init__(self):
        ...
        self.update(type(self).__name__)

    def update(self, sender, *args):
        y = self.presentSection.update()
        self.editSection.update(y=y)
        self.codeSection.update(y=y + 35)
        _, height = ui.get_screen_size()
        self.mainView.content_size = (320, y + height / 2)
```

在 `ViewController` 中实现 `update` 函数，并以此做各部分之间的协调。为后续的扩展，提供固定参数 sender 和可变长参数 *args。令 `presentSection` 在更新完毕后返回最后的高度位置，以此动态调整其后控件的具体高度。最后第11、12行优化页面滚动范围。以下是 `update` 在其他控件内的实现。

```python
class PresentSection(object):
    ...
    def update(self):
        y = 0
        # TODO: add contents
        self.mainView.height = y
        return self.mainView.y + y + 5

class EditSection(object):
    ...
    def update(self, y=None):
        if y:
            self.mainView.y = y

class CodeSection(object):
    ...
    def update(self, y=None):
        if y:
            self.mainView.y = y
```

由于数据的存储格式尚未明确，我们先省略 `PresentSection` 里面的实现。

那么到此我们理论上实现了动态 GUI 的生成，接下来开始做具体补充。

# 具体功能

## 添加条目

为了能使画面中显示一些实际的内容，我们先来完成具体数据的添加。尽管可以想见数据不会过多，但由于我们需要频繁的进行增删改查，普通文件写入写出的方式显然不太适合我们的需求。幸运的是 Pythonista3 支持 `Shelve` 这个模块，这次我打算以此管理数据。

```python
class EditSection(object):
    ...
    def submitAction(self, sender):
        name, *msg = sender.superview['name'].text.split('-')
        msg = ', '.join(msg)
        cost = sender.superview['cost'].text
        date = str(datetime.date.today())
        if not (name and cost): return

        with shelve.open('database') as db:
            db.setdefault(name, [])
            db[name] += [(int(cost), date, msg)]
        self.controller.update(type(self).__name__)
        sender.superview['name'].text = ''
        sender.superview['cost'].text = ''
        sender.superview['name'].end_editing()
        sender.superview['cost'].end_editing()
```

得益于 `Shelve` 类似字典般的结构，我们以每个人的名字作为 key，value 为此人每一笔支出构成的列表，每笔支出则由金额、日期、备注三部分构成。

在第12行处，由于我们没有用 `writeback=True` 的方式打开数据库，所以 `Shelve` 对象不会自动检测数据的变动，即我们不能使用 append 函数为列表做修改。此外在修改完毕后，通过 controller 的 update 函数通知上层，让其分发其他命令。最后不要忘记将这个函数注册给我们设定好的提交按钮。

那么有了数据我们便可以着手为 `presentSection` 添砖加瓦了。因为每次更新后不容易锁定具体被修改的内容，所以 `update` 函数的主要思路即为 “清空重做”。

```python
class PresentSection(object):
    ...
    def constructContent(self, frame, name, cost, date, msg=None):
        view = ui.View(frame=frame, flex='LR')
        view.add_subview(ui.Button(
            frame=(0, 0, 50, 30),
            name=f'{name}',
            title=name,
            action=self.contentAction,
            tint_color='black'))
        view.add_subview(ui.Label(
            frame=(60, 0, 240, 30),
            name='info',
            text=f'{str(cost)}, {date}{", " if msg else ""}{msg}'))
        return view
    
    def contentAction(self, sender):
        self.controller.update(type(self).__name__, sender.name)
    
    def update(self):
        for subview in self.mainView.subviews:
            self.mainView.remove_subview(subview)
            del subview
        y = 0
        with shelve.open('database') as db:
            if len(db.keys()):
                for name, lst in db.items():
                    for (cost, date, msg) in lst:
                        self.mainView.add_subview(self.constructContent(
                            (10, y, 290, 30), name, cost, date, msg))
                        y += 32
            else:
                self.mainView.add_subview(ui.Label(
                    frame=(0, 0, 300, 30),
                    text='currently no data yet',
                    alignment=ui.ALIGN_CENTER))
                y += 32
        self.mainView.height = y
        return self.mainView.y + y + 5
```

鉴于每个条目的控件布局都是一样的，但并没有其他定制化的特殊操作，我们仅仅采用一个函数统一生成。

## 快速填入姓名

此外，为了方便输入，这里我们加入一个使用的小功能：将每个条目的名字部分改为 `Button`，当该按钮被点击时自动把对应的姓名填入编辑框中。这时候我们在 `ViewController.update` 中预留好的 sender 和 *args 便派上了用场。sender 用来识别命令发出的源头，\*args 的第一个元素用来传递我们要输入的内容。此时只需在 `ViewController.update` 和 `EditSection.update` 中做些许修改即可。

```python
class ViewController(object):
    ...
    def update(self, sender, *args):
        if sender == PresentSection.__name__:
            self.editSection.update(name=args[0])
        else:
            y = self.presentSection.update()
            self.editSection.update(y=y)
            self.codeSection.update(y=y + 35)
            _, height = ui.get_screen_size()
            self.mainView.content_size = (320, y + height / 2)

class EditSection(object):
    ...
    def update(self, name=None, y=None):
        if name:
            self.mainView['name'].text = name
        if y:
            self.mainView.y = y
```

## 实时代码执行

之前我们提到这次设计的工具并没有完全提供 “删改” 的 UI，改为了代码实现，接下来就对此进行简要介绍。

实际执行由 `submitAction` 函数负责，调用 `exec` 函数，外加捕获异常以避免运行途中崩溃。而且大多情况下执行的代码会修改数据，所以执行完毕后需要刷新主界面。

<div class="img-frame">
    <img src="/assets/src/split-the-bill/snippets.jpeg" style="height: 200px;">
    <img src="/assets/src/split-the-bill/snippets_input.jpeg" style="height: 200px;">
</div>

执行按钮左侧为代码片段按钮，主要是为了方便部分代码的输入。实现得比较简单，就在此略过了。效果大致如上图。

至此，我们已经几乎完成了除核心函数以外的所有内容，接下来让我们做最终补全。

# 核心函数

算法思路比较简单。先汇总每人的当天支付额，在算出平均数后，构建每人的差额字典。通过贪心算法，从额度较大的人开始支付，以避免过多的 “转移记录”。

```python
def splitBill(date):
    def round(x): return int(ceil(x) if x - int(x) > 0.5 else floor(x))

    with shelve.open('database') as db:
        total = {name: sum(x[0] for x in info if x[1] == date) for name, info in db.items()}
        average = round(sum(total.values()) / len(total))
        delta = {name: cost - average for name, cost in total.items()}
        log = list()
        
        payerList = sorted(total.keys(), key=lambda x: delta[x])
        for payer in payerList:
            if delta[payer] >= 0: continue
            receivers = sorted(
                [name for name, _ in delta.items() if name != payer],
                key=lambda x: delta[x],
                reverse=True)
            for receiver in receivers:
                if delta[receiver] <= 0: continue
                shift = min(delta[receiver], abs(delta[payer]))
                delta[receiver] -= shift
                delta[payer] += shift
                log.append(f'{payer} -> {receiver} : {shift}')
                if delta[payer] >= 0: break

        msg = '\n'.join([f'{name} paid {cost} in total' for name, cost in total.items()])
        msg += f'\n\n{sum(total.values())} in total, {average} per capita\n\n'
        msg += '\n'.join(log)
        console.alert(title=f'Result of {date}', message=msg)
```

# 简单测试

<div class="img-frame">
    <img src="/assets/src/split-the-bill/GUI.jpeg" style="height: 200px;">
    <img src="/assets/src/split-the-bill/test.jpeg" style="height: 200px;">
</div>

希望这个小工具能够切实地解决即将到来的旅途中的一些需求。

[点击下载本文代码](/assets/src/split-the-bill/split-the-bill.py)
