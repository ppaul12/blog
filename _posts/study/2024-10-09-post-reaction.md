---
layout: post
title: 静态博客文章reaction
subtitle: 基于GoatCounter event实现
tags: 博客搭建
required: code
---

> 2024.11.03：本站已将评论系统由[utterances](https://utteranc.es)迁移至[giscus](https://giscus.app)。giscus基于GitHub Discussion构建，支持对于整体的reaction。因此本文内容已不在本站使用，仅供读者参考。
{: .warn}

- toc
{:toc}

常见第三方评论系统，如[disqus](https://disqus.com)、[waline](https://waline.js.org)等，都支持对于博客文章的reaction功能。然而秉持着缩减建站所需的账户数量，以及集中博客相关的数据的目的，我尽可能地将博客代码和文章评论都统一在了GitHub上。代码自成一个仓库，文章评论则由[utterances](https://utteranc.es)自动生成于仓库的issue中。但由于是静态博客，GitHub仓库也不提供基础的数据库功能，因此访问量相关的数据就必须依赖第三方的服务保管。曾经使用的是[Google Analytics](https://developers.google.com/analytics)，后转为了更为轻量易用的[GoatCounter](https://www.goatcounter.com)。GoatCounter所提供的基础功能只是简单的浏览统计，引入指定`Javascript`文件，无需额外配置，即可记录访问量。一筹莫展之际，`events`功能却为文章的reaction提供了一丝希望。

# 按钮设计

两个交互按钮居中，之间稍留空隙。图标和信息用伪元素`::before`和`::after`实现，以保证点击事件只会被一个标签捕捉。随后便做悬停时`:hover`和激活状态`active`相关的美化即可。以下为可反复点击的测试用按钮。

<div style="text-align: center;">
    <div class="post-reaction-good" onclick="clickReactionTest(event)" data-tag="good" data-num="2"></div>
    <div class="post-reaction-bad" onclick="clickReactionTest(event)" data-tag="bad" data-num="1"></div>
</div>

<script>
clickReactionTest = (event) => {
    const reactionButton = event.target
    reactionButton.dataset.num = Number(reactionButton.dataset.num) + 1
    reactionButton.toggleAttribute("active", true)
    window.setTimeout(() => {
        reactionButton.toggleAttribute("active", false)
    }, 3000)
}
</script>

```scss
.post-reaction {
    text-align: center;

    &-good, &-bad {
        display: inline-block;
        position: relative;
        margin: 0 1em;
        text-align: center;
        color: grey;

        &::before {
            display: block;
            font: 900 1.5em "Font Awesome 6 Free";
        }

        &::after {
            display: block;
            font-size: 0.8em;
            content: attr(data-num);
        }
    }

    &-good::before {
        content: "\f164";
    }

    &-bad::before {
        content: "\f165";
    }
}
```
{: .line-numbers}

整个控件应包含在`post-reaction`类中，两个按钮的类应分别为`post-reaction-good`和`post-reaction-bad`。此外，每个按钮应保有两个`dataset`值。`data-tag`用作event名称设定，需显式写在对应标签里。`data-num`用来暂存点击数量，无需显式写明。

# 事件绑定

尽管GoatCounter可以防止一定时间内的重复事件，但我们仍最好保证同一用户无论何时都不会二次点赞或是点踩。为此，则需借助`localStorage`长期保存的特性，同时在页面加载时也可基于此设定整个标签是否可以响应点击事件。

```javascript
const clickReaction = (event) => {
    const reactionBlock = document.querySelector(".post-reaction")
    if (reactionBlock.getAttribute("disabled") !== null) {
        return
    }

    const reactionButton = event.target
    window.goatcounter.count({
        path: `${reactionButton.dataset.tag}${window.location.pathname}`,
        title: `${document.title}#${reactionButton.dataset.tag}`,
        event: true,
    })
    reactionButton.dataset.num = Number(reactionButton.dataset.num) + 1
    reactionButton.toggleAttribute("active", true)
    reactionBlock.toggleAttribute("disabled", true)
    window.localStorage.setItem(window.location.pathname, reactionButton.dataset.tag)
}
```
{: .line-numbers data-line="8-12"}

其中高亮部分便是实际向GoatCounter发送event的部分。阅读[文档](https://www.goatcounter.com/help/events)可知，`path`中的内容也同时会被当作event name，所以不能以`/`开头。此外便可根据自身需求设定即可。

# 数据获取

最后是整个控件初始化以及获取已得到的reaction数量的部分。遍历每个按钮时同时查询`localStorage`中的信息，倘若已经点击过，则切换其显式模式，并设整体为不可点击状态。

```javascript
const postReaction = document.querySelector(".post-reaction")
if (postReaction !== null) {
    Array.from(postReaction.children).forEach((item) => {
        // init button state
        if (window.localStorage.getItem(window.location.pathname) === item.dataset.tag) {
            item.toggleAttribute("active", true)
            postReaction.toggleAttribute("disabled", true)
        }
        // fetch reaction number
        fetch(`https://YourID.goatcounter.com/counter/${item.dataset.tag}${encodeURIComponent(window.location.pathname)}.json`)
            .then((response) => response.json())
            .then((data) => {
                item.dataset.num = data.count.replace(' ', '')
            })
            .catch(() => {
                item.dataset.num = 0
            })
    })
}
```
{: .line-numbers data-line="10"}

高亮部分是向GoatCounter获取reaction数量的代码，应注意`.json`文件的名称要与发送时所设定的`path`名称相同。
