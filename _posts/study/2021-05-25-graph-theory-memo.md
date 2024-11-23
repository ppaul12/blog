---
layout: post
title: 图论
tags: 离散数学 备忘录
required: math graph
---

# 图

## 无序积

$$
A\&B=\{(a,b)\vert a\in A\land b\in B\}\quad\text{where }(a,b)=(b,a)
$$

## 图

- 无向图：$G=<V,E>\quad(E\subseteq V\&V)$
- 有向图：$G=<V,E>\quad(E\subseteq V\times V)$，也常用字母$D$

## 相关概念

- 顶点集：$V(G)$，顶点数：$\vert V(G)\vert$，阶：顶点数（n顶点图为n阶图）
- 边集：$E(G)$，边数：$\vert E(G)\vert$
- 零图：无边的图，1阶零图称为平凡图
- 空图$\emptyset$：顶点集为空的图
- 基图：将**有向图**中的**有向边**改为**无向边**而得到的**无向图**
- 标定图/非标定图
- 关联：顶点与边的关系，关联次数：边连接顶点的次数
- 孤立点：图中无边关联的顶点

## 邻域

- 无向图
    - 邻域：$N_G(v)=\\{u\in V\vert(u,v)\in E\land u\neq v\\}$
    - 闭邻域：$\overline{N_G}(v)=N_G(v)\cup\\{v\\}$
    - 关联集：$I_G(v)=\\{e\in E\vert e与v关联\\}$

- 有向图
    - 后继元集：$\Gamma_D^+(v)=\\{u\in V\vert<v,u>\in E\land u\neq v\\}$
    - 先驱元集：$\Gamma_D^-(v)=\\{u\in V\vert<u,v>\in E\land u\neq v\\}$
    - 邻域：$N_D(v)=\Gamma_D^+(v)\cup\Gamma_D^-(v)$
    - 闭邻域：$\overline{N_D}(v)=N_D(v)\cup\\{v\\}$

## 简单图

- 平行边：无向图中多条关联同一组顶点的边，有向图中多条首尾相通的边
- 重数：平行边的条数，多重图
- **简单图**：不含平行边和环的图（simple graph）

## 度

- 无向图
    - $d_G(v)$：顶点作为边的端点的次数
    - 最大度：$\Delta(G)=\max\\{d(v)\vert v\in V(G)\\}$
    - 最小度：$\delta(G)=\min\\{d(v)\vert v\in V(G)\\}$

- 有向图：$d_D(v)=d_D^+(v)+d_D^-(v)$

## 握手定理

- 任何无环图中，顶点度数之和等于边数的二倍
- $\sum_{v\in V}d(v)=2\cdot\vert E\vert$
- 推论：任何图中，奇度顶点的个数为偶数

## 可图化

- 充要条件：对于非负整数列$d=(d_1,d_2,\cdots,d_n)$，$\sum d_i$为偶数（定理14.3）
- 可简单图化过程：$(5,4,3,2,2)\to(3,2,1,1)\to(1,0,0)\implies不可简单图化$

## 同构：图上二元等价关系

## (n阶)完全图 $K_n$

- 图中每个顶点均与其他$n-1$个顶点相连接
- 竞赛图：基图为n阶无向完全图的n阶有向简单图

## (k-)正则图

## 二部图，二分图，偶图

- $G=<V_1,V_2.E>,V_1\cup V_2=V,V_1\cap V_2=\emptyset$
- $K_{r,s}=<V_1,V_2,E>,r=\vert V_1\vert,s=\vert V_2\vert$
- 完全二部图：$\vert V_1\vert=\vert V_2\vert$
- 判定(充要)：图中无奇圈

## 图的操作

# 通路与回路

- **简单的**：只经过一次同一条**边**
- **初等的**：只经过一次用一个**点**
- 初级的：简单且初等

# 连通性

## (无向图)连通

- 两点间有通路（顶点间二元等价关系）
- 连通图：任意两点连通
- 连通分枝：由连通关系构建的等价类，用$p(G)$表示连通分支数

## **点割集**

若存在$V^\prime\subset V$使得$p(G-V^\prime)>p(G)$，且对于任意的$V^{\prime\prime}\subset V^\prime$，均有$p(G-V^{\prime\prime})=p(G)$，则称$V^\prime$是G的点割集，割集元素唯一时称为割点

## 点连通度

$\kappa(G)=\min\\{\vert V^\prime\vert\ \vert V^\prime为G的点割集\\}$，若$\kappa(G)\ge k$则称$G$为k-连通图

## **边割集**

若存在$E^\prime\subset E$使得$p(G-E^\prime)>p(G)$，且对于任意的$E^{\prime\prime}\subset E^\prime$，均有$p(G-E^{\prime\prime})=p(G)$，则称$E^\prime$是G的边割集，割集元素唯一时称为割边或桥

## 边连通度

- $\lambda(G)=\min\\{\vert E^\prime\vert\ \vert E^\prime为G的边割集\\}$，若$\lambda(G)\ge r$则称$G$为r边-连通图 
- k-(点)连通图去掉任意k-1个顶点后仍连通
- r-边连通图去掉任意r-1条边后仍连通
- $\kappa(G)\le\lambda(G)\le\delta(G)$，点连通度≤边连通度≤最小度

## **门格尔定理**（有限无向图）

- 点连通描述：k-点连通$\iff$任意两点间均有k条不共点的通路
- 边连通描述：k-边连通$\iff$任意两点间均有k条不共边的通路

## 有向图连通

- 弱连通：基图连通
- 单向连通：对于任意两点，至少单方向可达
- 强连通：对于任意两点，双向可达
- 强连通判定(充要)：$D$中存在经过每个顶点至少一次的回路

# 欧拉图与哈密顿图

## 欧拉**通路**

- 经过所有边一次+所有点的通路，半欧拉图
- 无向半欧拉图判定(充要)：连通图+**恰有2个奇度顶点**
- 有向半欧拉图判定(充要)：
    - 单向连通
    - 恰有2个奇度顶点：一个入度比出度大1，另一个出度比入度大1
    - 其余顶点入度=出度

## 欧拉**回路**

- 经过所有边一次+所有点的回路，欧拉图
- 无向欧拉图判定(充要)：连通图+**不存在奇度顶点**
- 有向欧拉图判定(充要)：强连通+所有顶点入度=出度

## Fleury算法

## 哈密顿通路

- 经过所有顶点一次的通路，半哈密顿图
- 判定(充分)：对于任意不相邻的顶点，$d(u)+d(v)\ge n-1$
- $n(n\ge2)$阶竞赛图中含有哈密顿通路

## 哈密顿回路

- 经过所有顶点一次的回路，哈密顿图（平凡图为哈密顿图）
- 判定(充分)：对于任意不相邻的顶点，$d(u)+d(v)\ge n$

# 树

- 无向树：连通无回路的无向图
    - 森林：每个连通分量都是树的无向图
    - 平凡树：平凡图

- 生成树：为树的无向图的生成子图（包含所有顶点的子图）
    - 树枝：生成树中的边
    - 弦：不在生成树中的边
    - 余树：由所有弦导出的子图（不一定连通，不一定含回路）

# 平面图

## (可)平面图

- 将图画在平面上且除顶点外边不相交，画出的平面图为原图的平面嵌入
- 极大平面图：在当前图中的任意不相邻的两点间加入边后即为非平面图的图
- $K_5$和$K_{3,3}$为**非平面图**（极小非平面图），且任意平面图不含其作为缩约
- 简单平面图的最小度≤5（由握手定理可证）

## 外平面图(outer planar graph)

- 所有顶点均在同一面内（是平面图的子集）
- $K_4$和$K_{2,3}$为非外平面图，且任意外平面图不含其作为缩约

## 面

- 由图的平面嵌入划分出的区域
- 无限面，外部面：面积无限的面
- 有限面，内部面：面积有限的面
- 边界：包围面的回路，回路长为该面的次数
- 面次数之和 = 边数的二倍

## **约当定理**

自身不相交的闭曲线会将平面分为内外两部分（连接内外的连续曲线必与给定闭曲线相交）

## **欧拉公式**

$$
\vert V\vert-\vert E\vert+\vert F\vert=2
$$

- 推广：对于有k个连通分支的平面图，有$\vert V\vert-\vert E\vert+\vert F\vert=k+1$成立
- 对于连通平面图，面的最小次数为$l\ge3$，则$\vert E\vert\le\frac{l}{l-2}(\vert V\vert-2)$成立

$$
证:
\begin{cases}
2\vert E\vert=\sum_i\text{deg}(R_i)\ge l\cdot\vert F\vert\\
\vert F\vert=2+\vert E\vert-\vert V\vert
\end{cases}
\Rightarrow
2\vert E\vert\ge l\cdot(2+\vert E\vert-\vert V\vert)
$$

## 对偶图

![](/assets/src/graph-theory-memo/duals graphs.svg){: width="30%"}

- 性质1
    - 对偶图为平面图，且为平面嵌入
    - 对偶图连通
    - 原图中的环为对偶图中的桥，反之亦然（二部图与欧拉图对偶）
- 性质2：$G=<V,E>\iff G^\ast<V^\ast,E^\ast>$
    - $\vert V^*\vert=\vert F\vert$
    - $\vert E^*\vert=\vert E\vert$
    - $\vert F^*\vert=\vert V\vert$
    - $d_{G^\ast}(v^\ast_i)=\text{deg}(R_i)\quad\text{where }v^\ast_i\text{ inside }R_i$

# 匹配与着色

## 支配集

![](/assets/src/graph-theory-memo/dominating set.svg){: width="30%"}

- 图中所有不属于支配集(红色)的顶点一定会与支配集相邻
- 极小支配集：该支配集的任意真子集均不是支配集
- 最小支配集：顶点数最小的支配集，记顶点数为该图的支配数$\gamma_0(G)$

## 独立集

- 点独立集
    - 任意两顶点均不相邻的顶点集的子集
    - 极大点独立集：加入任意顶点就不再为独立集的独立集
    - 最大点独立集：顶点数最多的对立，记顶点数为该图的点独立数$\beta_0(G)$

- **边独立集**（匹配）
    - 任意两边均不相邻(不共有端点)的边集的子集
    - 极大边独立集，最大边独立集：$\beta_1(G)$

## 覆盖集

- 点覆盖集
    - 图中所有边均与点覆盖集相关联（有端点在覆盖集内）
    - 极小点覆盖集，最小点覆盖集：$\alpha_0(G)$

- 边覆盖集
    - 图中无孤立点，且所有顶点均与边覆盖集相关联（为其中边的端点）
    - 极小边覆盖集，最小边覆盖集：$\alpha_1(G)$

- 无向简单图的最大点独立集是最小支配集（反之不成立）（定理18.1）
- $V^\ast$ 为G的点覆盖集 $\iff\overline\{V^\ast\}=V-V^\ast$ 为G的点独立集（定理18.2）

## **匹配**

- 匹配边/非匹配边：是否在匹配中
- 饱和点/非饱和点：是否与匹配边相关联
- 完美匹配：所有顶点均饱和
- 交错路径：有匹配边和非匹配边交替构成的路径
- 可增广的交错路径：起点和终点均为非饱和点的交错路径
- \|匹配\|≤\|点覆盖集\|
    - 取等时为最大匹配、最小点覆盖，二部图Köning定理
    - 如果等号成立，则匹配为最大匹配、点覆盖为最小点覆盖。并不意味反之会取等
- \|点独立集\|≤\|边覆盖集\|
    - 取等时为最大点独立集、最小边覆盖集
- 最大匹配$\iff$原图中不存在关于该匹配的可增广交错路径

## 二部图中的匹配

- 完备匹配：$\vert M\vert=\vert V_1\vert,\vert V_1\vert\le\vert V_2\vert$
- Hall定理(充要)：$V_1$中任意$k$个顶点至少与$V_2$中的$k$个顶点相邻

# 网络流

## 网络(network)

$$
N=(V,E,c,s,t)\quad\text{c: capacity, s: source, t: sink}
$$

## 流量(flow)

- 容量制约：$\forall e\in E,0\le f(e)\le c(e)$
- 流量保存

$$
-\sum_{e=(u,v)\in E}f(e)+\sum_{e=(v,w)\in E}f(e)=
\begin{cases}
+F\quad v=s\\
-F\quad v=t\\
0\quad\text{else}
\end{cases}
$$

- 最大流量：$F=F(f)$

## 网络的点割集

- $s\in S\subseteq V-\\{t\\}$，含入不含出的点集
- 点割集的容量：$c(S)=\sum c(e)\quad(e=(u,v)\in E,u\in S,v\not\in S)$，能从S流出的总量
- $\forall f:\text{flow},\forall S:\text{cut},F(f)\le c(S)$

## 最大流最小割定理

$$
\max\{F(f)\vert f:\text{flow}\}=\min\{c(S)\vert S:\text{cut}\}
$$

- 算法：$O(\vert V\vert\vert E\vert^2)$
    - 辅助图构造

        $$
        N(f):=(V,E^\prime,c^\prime,s,t),
        \begin{cases}
        0=f(e)<c(e)\quad&c^\prime(e):=c(e)&\rightarrow\\
        0<f(e)<c(e)\quad&
        \begin{aligned}
        &c^\prime(e):=c(e)-f(e)\\
        &c^\prime(e^\prime):=f(e),e^\prime=(v,u)
        \end{aligned}&\leftrightarrow\\
        0<f(e)=c(e)\quad&c^\prime(e^\prime):=c(e)&\leftarrow
        \end{cases}
        $$

    - 流程图

        <figure class="mermaid">
        flowchart TD
            start("flow=0")
            findPath["计算N(f)中s到t的有向通路P"]
            check{"P是否存在?"}
            updatePath1[["计算𝛿=min{c'(e'), e'∈P}"]]
            updatePath2[["对所有e'∈P，如果e与e'同向f(e)+=𝛿，否则f(e)-=𝛿"]]
            final("结束")

            start --> findPath --> check -- yes --> updatePath1 --> updatePath2 --> findPath
            check -- no --> final
        </figure>

# 线性规划问题

# 拟阵

## 拟阵：线性独立+图论

- 基(Basis)：极大独立集(可类比于线性空间的基底)
- 环(Circuit)：极小非独立集

## 拟阵公理(Independence Axiom)

对于全集$E$，有拟阵$(E,\mathcal{I}),\mathcal{I}\subseteq\mathcal{P}(E)$

- (I1) $\emptyset\in\mathcal{I}$
- (I2,遗传性质) $Y\subseteq X\subseteq\mathcal{I}\Rightarrow Y\subseteq\mathcal{I}$
- (I3,交换性质) $X,Y\subseteq\mathcal{I},\vert X\vert+1=\vert Y\vert\Rightarrow\exists y\in Y\setminus X,X\cup\\{y\\}\subseteq\mathcal{I}$
- (I3') $\forall S\subseteq E,\forall\text{maximal set in }\mathcal{P}(S)\cap\mathcal{I}\text{ is of the same size}$ (所有基大小相等)

## 基交换定理(Base Axiom)

对于全集$E$，有拟阵$(E,\mathcal{Base}),\mathcal{B}\subseteq\mathcal{P}(E)$

- (B1) $A,B\in\mathcal{B},\forall x\in A\setminus B,\exists y\in B\setminus A,A\setminus\\{x\\}\cup\\{y\\}\in\mathcal{B}$

## 秩函数性质(Rank Axiom)

$r:\mathcal{P}(E)\to\mathbb{Z}_{\ge0}$

- 定义：$S\subseteq E$ 的秩为 $S$ 的子集中极大独立集的大小
- (R1,有界性) $\forall S\subseteq E,0\le r(S)\le \vert S\vert$
- (R2,单调性) $\forall A\subseteq B\subseteq E,r(A)\le r(B)$
- (R3,次模性) $\forall A,B\subseteq E,r(A\cup B)+r(A\cap B)\le r(A)+r(B)$

## 环(Circuit Axiom)

对于全集$E$，有拟阵$(E,\mathcal{C}),\mathcal{C}\subseteq\mathcal{P}(E)$

- (C1) $A\neq B\in\mathcal{C}\Rightarrow A\not\subseteq B$
- (C2) $A\neq B\in\mathcal{C},x\in A\cap B\Rightarrow\exists X\in\mathcal{C},X\subseteq(A\cup B)\setminus\\{x\\}$ (复杂环可以用简单环代替)

# 参考资料

- [离散数学](https://baike.baidu.com/item/离散数学/4210720)
- [拟阵及应用1](https://zhuanlan.zhihu.com/p/53976000)
- [拟阵及应用2](https://zhuanlan.zhihu.com/p/54072907)
- [拟阵及应用3](https://zhuanlan.zhihu.com/p/54178375)
- [拟阵及应用4](https://zhuanlan.zhihu.com/p/54713563)
