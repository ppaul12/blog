---
layout: post
title: How to build a hex-editor
tags: Ncurses C/C++
lang: en
---

> click [here](https://github.com/PENG-AO/Hex-editor) for the GitHub repo of this project.

# 1. Introduction

In this post, I'm going to build a hex editor for the practice of using C++. Compared with a normal text editor, a hex editor is much easier, which is suitable for practice.

In the following parts, there will be an analysis of implementing functions and the whole structure, and then a brief test.

# 2. Overall Analysis

To begin with, I prefer TUI more than GUI for its simplicity and complicity with the daily use terminal, and this hex editor will be terminal-based. Moreover, besides using TUI to modify binary data, a complete API is expected as well, which is handy for programmable usage. As a result, the blueprint is obvious: a kernel that stores data and handles editions and a wrapper that provides APIs and a TUI interface.

For the kernel part, there should only be minimal operations with the simplest parameters to modify stored data.

- revise: change data in place
- insert: add a new byte between existed ones
- remove: completely delete an existed data

For a database addition, deletion, modification, and query are the basis, since the need for finding is not that necessary in our condition, the aforementioned 3 operations seem sufficient.

On the other hand, besides the edition within the program, the wrapper on the upper layer should provide operations with the outside world as well. Therefore,

- save

is inevitable. What's more, to improve user experience, operations like

- undo
- redo

will be convenient.

# 3. Detailed Structure

So far, we are ready for the detailed design. (The interactive part that uses ncurses is skipped.)

## 3.1 Buffer List

Intuitively, an editor loads the raw data from files to its buffer, and future modifications are firstly conducted on the inner buffer, then saves back when necessary for efficiency. Since some operations change the total length of data, the data structure of a sequential array is not suitable. Although a linked list is bad at random access, considering the actual usage at the TUI interface that users move the cursor to select certain data, this defect could be avoided by storing the selected node previously at the stage of rendering. So linked list is adopted as the main structure of the data buffer.

## 3.2 Command Stack

Undoubtedly, the functions of undo and redo are based on stacks, and the only problem left is the mechanism of syncing those commands. Treating the sequence of commands as a stream, undo is just like tracing back, and redo is its reverse: moving forward. Whenever a new command cuts into the current, those commands that are not redone should be aborted since a new stream is created.

<div class="img-frame"><img src="/assets/src/hex-editor/commands-flow.png"></div>

# 4. Tests

Compile the project by

```shell
$ make
````

and there will be an executable file with the name `editor`. Then open an existed binary file by

```shell
$ ./editor test.bin
```

and it looks like this in my terminal.

<div class="img-frame"><img src="/assets/src/hex-editor/main-window.png"></div>

Please check my repo for more detailed usages.
