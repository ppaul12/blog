---
layout: post
title: NVIM配置
tags: 操作系统 备忘录
required: code
---

Neovim
```bash
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
{: .line-numbers}

---

Config
```bash
# 克隆并清理LazyVim的仓库
git clone https://github.com/LazyVim/starter ~/.config/nvim
rm -rf ~/.config/nvim/{.git,LICENSE,.gitignore,README.md,lua/plugins/example.lua}
```
{: .line-numbers}

```lua
-- 编辑 ~/.config/nvim/lua/config/options.lua 文件
vim.opt.tabstop = 4
vim.opt.shiftwidth = 4
vim.opt.expandtab = true
vim.opt.conceallevel = 0

vim.api.nvim_create_autocmd("LspAttach", {
    callback = function()
        vim.opt_local.tabstop = 4
        vim.opt_local.shiftwidth = 4
        vim.opt_local.expandtab = true
    end
})
```
{: .line-numbers}

```lua
-- 创建并编辑 ~/.config/nvim/lua/plugins/init.lua 文件
return {
    {
        "nvimdev/dashboard-nvim",
        enabled = false,
    },

    { "EdenEast/nightfox.nvim" },
    {
        "LazyVim/LazyVim",
        opts = {
            colorscheme = "nordfox",
        },
    },

    {
        "williamboman/mason.nvim",
        opts = {
            ensure_installed = {
                "clangd",
                "pyright",
                "lua-language-server",
                "html-lsp",
                "css-lsp",
                "typescript-language-server",
                "marksman",
                "texlab",
            },
        },
    },

    {
        "nvim-treesitter/nvim-treesitter",
        opts = {
            ensure_installed = {
                "c",
                "cpp",
                "python",
                "lua",
                "html",
                "css",
                "scss",
                "liquid",
                "javascript",
            },
        },
    },
}
```
{: .line-numbers}

```lua
--- 编辑 ~/.config/nvim/lua/config/lazy.lua 文件
require("lazy").setup({
    spec = {
        { "LazyVim/LazyVim", import = "lazyvim.plugins" },
        { import = "lazyvim.plugins.extras.ui.mini-indentscope" }, -- add this line
        { import = "lazyvim.plugins.extras.coding.mini-surround" }, -- add this line
        { import = "plugins" },
    },
})
```
{: .line-numbers}

有关LazyVim详细的Keymaps可参照其[主页](http://www.lazyvim.org/)，或[此链接](http://www.lazyvim.org/keymaps)。
