---
layout: post
title: 终端配置memo
tags: Terminal 
---

# 1. 终端

## 1.1 软件

- macOS: iTerm2
    ```shell
    $ brew intall --cask iterm2
    ```
- Ubuntu: default terminal

## 1.2 主题

> 个人偏好: ***[Nord theme](https://www.nordtheme.com)***

- macOS: iTerm2
    1. 于[nord-iterm2](https://github.com/arcticicestudio/nord-iterm2)下载最新`Nord.itermcolors`
    1. 于 Preferences > Profiles > Colors > Color Presets... > Import... 处导入
    1. 选择对应颜色主题
- Ubuntu: default terminal
    1. 克隆[nord-gnome-terminal](https://github.com/arcticicestudio/nord-gnome-terminal)仓库
    1. 进入`src`目录
    1. 运行`nord.sh`
        ```shell
        $ git clone https://github.com/arcticicestudio/nord-gnome-terminal.git
        $ cd nord-gnome-terminal/src
        $ ./nord.sh
        ```
    1. 选择对应颜色主题

# 2. shell

## 2.1 软件

> 个人偏好: ***zsh***

1. 安装zsh
    - macOS: 已安装
    - Ubuntu: 需确认
        ```shell
        $ cat /etc/shells
        $ sudo apt install zsh
        ```
1. 设置zsh为默认shell
    ```shell
    $ chsh -s $(which zsh)
    ```
1. 重新登入(log out $\to$ log in)以使用新默认设定
1. 确认新shell为zsh
    ```shell
    $ echo $SHELL
    ```

## 2.2 主题

> 个人偏好: ***[oh-my-zsh](https://ohmyz.sh)*** + ***[powerlevel10k](https://github.com/romkatv/powerlevel10k)***

1. 安装oh-my-zsh
    ```shell
    $ sh -c "$(wget https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"
    ```
1. 克隆powerlevel10k仓库
    ```shell
    $ git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
    ```
1. 在`~/.zshrc`中设定主题
    ```bash
    ZSH_THEME="powerlevel10k/powerlevel10k"
    ```
1. 反映最新配置
    ```shell
    $ source ~/.zshrc
    ```

## 2.3 插件

- 语法高亮
    1. 克隆zsh-syntax-highlighting仓库
        ```shell
        $ git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
        ```
    1. 在`~/.zshrc`中添加配置信息
        ```bash
        plugins=(... zsh-syntax-highlighting)
        ```
    1. 反映最新配置
        ```shell
        $ source ~/.zshrc
        ```
- 无命令提示(Ubuntu only)
    1. 在`~/.zshrc`中添加配置信息
        ```bash
        source /etc/zsh_command_not_found
        ```
    1. 反映最新配置
        ```shell
        $ source ~/.zshrc
        ```
- GUI命令补全(macOS only)
    1. 使用***[fig](https://fig.io)***
        ```shell
        $ brew install --cask fig
        ```
    1. 在fig中完成配置
        ```shell
        $ fig launch
        ```
- 命令行检索
    1. 在`~/.zshrc`中添加配置信息
        ```bash
        plugins=(... web-search)
        ``` 
    1. 反映最新配置
        ```shell
        $ source ~/.zshrc
        ```
    1. 检索工具列表
        - google
        - baidu
        - yahoo
        - youtube
        - github
        - stackoverflow
        - wolframalpha
        - scholar
        - ...

