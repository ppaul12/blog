---
layout: post
title: 终端配置memo
tags: 操作系统
required: code
---

Terminal Installation
```bash
# macOS: 安装iTerm2
brew install --cask iterm2
# Ubuntu: 默认终端
```

---

Terminal Theme
```bash
# macOS: iTerm2
# 下载专用配色文件
wget https://raw.githubusercontent.com/nordtheme/iterm2/develop/src/xml/Nord.itermcolors
# 导入iTerm2
open Nord.itermcolors
# 于 Preferences > Profiles > Colors 处选择主题
# Ubuntu: 默认终端
# 克隆nord-gnome-terminal仓库
git clone https://github.com/arcticicestudio/nord-gnome-terminal.git
# 进入 src 目录
cd nord-gnome-terminal/src
# 运行安装文件
./nord.sh
# 回到终端选择颜色主题
```

---

Shell Installation
```bash
# 安装zsh
# macOS: 已安装
# Ubuntu: 需确认
cat /etc/shells
sudo apt install zsh
# 设置zsh为默认shell
chsh -s $(which zsh)
# 重新登入以使用新默认设定
logout
# 确认新shell为zsh
echo $SHELL
```

---

Shell Theme
```bash
# 安装oh-my-zsh
sh -c "$(wget https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"
# 克隆powerlevel10k仓库
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
# 在 ~/.zshrc 中设定主题
ZSH_THEME="powerlevel10k/powerlevel10k"
# 回到终端反映最新配置
source ~/.zshrc
```

---

Shell Plugins
```bash
# 克隆zsh-syntax-highlighting仓库
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
# 在 ~/.zshrc 中添加配置信息
plugins=(... zsh-syntax-highlighting)
# 回到终端反映最新配置
source ~/.zshrc
```

```bash
# 在 ~/.zshrc 中添加配置信息
# macOS
plugins=(... command-not-found)
# Ubuntu
source /etc/zsh_command_not_found
# 回到终端反映最新配置
source ~/.zshrc
```
