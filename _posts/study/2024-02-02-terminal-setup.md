---
layout: post
title: 终端配置memo
tags: 操作系统
required: code
---

# 终端

## 软件

- macOS: iTerm2
```shell
brew install --cask iterm2
```
- Ubuntu: default terminal

## 主题

> 个人偏好: ***[Nord theme](https://www.nordtheme.com)***

- macOS: iTerm2
    1. 于[nord-iterm2](https://github.com/arcticicestudio/nord-iterm2)下载最新`Nord.itermcolors`
    2. 于 Preferences > Profiles > Colors > Color Presets... > Import... 处导入
    3. 选择对应颜色主题
- Ubuntu: default terminal
```shell
# 克隆nord-gnome-terminal仓库
git clone https://github.com/arcticicestudio/nord-gnome-terminal.git
# 进入 src 目录
cd nord-gnome-terminal/src
# 运行安装文件
./nord.sh
# 回到终端选择颜色主题
```

# shell

## 软件

> 个人偏好: ***zsh***

```shell
# 安装zsh
# macOS: 已安装
# Ubuntu: 需确认
cat /etc/shells
sudo apt install zsh
# 设置zsh为默认shell
chsh -s $(which zsh)
# 重新登入以使用新默认设定
# 确认新shell为zsh
echo $SHELL
```

## 主题

> 个人偏好: ***[oh-my-zsh](https://ohmyz.sh)*** + ***[powerlevel10k](https://github.com/romkatv/powerlevel10k)***

```shell
# 安装oh-my-zsh
sh -c "$(wget https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"
# 克隆powerlevel10k仓库
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
# 在 ~/.zshrc 中设定主题
ZSH_THEME="powerlevel10k/powerlevel10k"
# 回到终端反映最新配置
source ~/.zshrc
```

## 插件

- 语法高亮
```shell
# 克隆zsh-syntax-highlighting仓库
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
# 在 ~/.zshrc 中添加配置信息
plugins=(... zsh-syntax-highlighting)
# 回到终端反映最新配置
source ~/.zshrc
```
- 无命令提示
```shell
# 在 ~/.zshrc 中添加配置信息
# macOS
plugins=(... command-not-found)
# Ubuntu
source /etc/zsh_command_not_found
# 回到终端反映最新配置
source ~/.zshrc
```

# 编辑器

## 软件

> 个人偏好: [Neovim](https://neovim.io)

```shell
# macOS
brew install neovim
# Ubuntu
sudo apt install ninja-build gettext cmake unzip curl
git clone https://github.com/neovim/neovim
cd neovim
git checkout stable
make CMAKE_BUILD_TYPE=RelWithDebInfo
cd build && cpack -G DEB && sudo dpkg -i nvim-linux64.deb
```

## 配置

> 个人偏好: [LazyVim](https://github.com/LazyVim/LazyVim)
