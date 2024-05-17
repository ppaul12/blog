---
layout: post
title: 四元数与旋转
tags: 计算机图形 备忘录
required: math
---

- toc
{:toc}

本篇简记四元数与三位旋转的相关内容，其中插值问题待后续展开。

# 三维空间旋转

考虑向量 $\mathbf{v}$ 关于轴 $\mathbf{u}$ 的 $\theta$ 度的旋转。
首先将 $\mathbf{v}$ 分解为平行于轴和垂直于轴的两个分量，分别处理其旋转问题。

$$
\mathbf{v}=\mathbf{v}_\Vert+\mathbf{v}_\bot
$$

其中平行于轴的分量即为 $\mathbf{v}$ 在 $\mathbf{u}$ 上的投影，因此

$$
\begin{aligned}
\mathbf{v}_\Vert
&=\text{proj}_{\mathbf{u}}(\mathbf{v})\\
&=\frac{\mathbf{u}\cdot\mathbf{v}}{\mathbf{u}\cdot\mathbf{u}}\mathbf{u}
\quad(\lVert\mathbf{u}\rVert=1)\\
&=(\mathbf{u}\cdot\mathbf{v})\mathbf{u}
\end{aligned}
$$

也不难得出

$$
\begin{aligned}
\mathbf{v}_\bot
&=\mathbf{v}-\mathbf{v}_\Vert\\
&=\mathbf{v}-(\mathbf{u}\cdot\mathbf{v})\mathbf{u}
\end{aligned}
$$

其次，对于 $\mathbf{v}_\Vert$ 而言不存在旋转，所以

$$
\mathbf{v}^\prime_\Vert=\mathbf{v}_\Vert
$$

但对于 $\mathbf{v_\bot}$ 而言则略略复杂。
俯视其旋转平面，不难发现 $\mathbf{v}_\bot$ 的旋转轨迹是该平面上的一段圆弧。
为此需在右手系下引入另一向量构成旋转平面的基底，从而加以表记。

$$
\mathbf{w}=\mathbf{u}\times \mathbf{v}_\bot
$$

若将 $\mathbf{v_\bot}$ 想象为平面的横轴，则由外积构造而来的 $\mathbf{w}$ 则正好为竖直向上的纵轴。
同时 $\lVert \mathbf{u}\rVert=1$，所以 $\lVert\mathbf{v}_\bot\rVert=\lVert\mathbf{w}\rVert$，则

$$
\begin{aligned}
\mathbf{v}^\prime_\bot
&=\cos\theta\mathbf{v}_\bot+\sin\theta\mathbf{w}\\
&=\cos\theta\mathbf{v}_\bot+\sin\theta(\mathbf{u}\times\mathbf{v}_\bot)
\end{aligned}
$$

统合上述结果

$$
\begin{aligned}
\mathbf{v}^\prime
&=\mathbf{v}^\prime_\Vert+\mathbf{v}^\prime_\bot\\
&=\mathbf{v}_\Vert+\cos\theta\mathbf{v}_\bot+\sin\theta(\mathbf{u}\times\mathbf{v}_\bot)\\
\end{aligned}
$$

由于

$$
\begin{aligned}
\mathbf{u}\times\mathbf{v}_\bot
&=\mathbf{u}\times(\mathbf{v}-\mathbf{v}_\Vert)\\
&=\mathbf{u}\times\mathbf{v}-\mathbf{u}\times\mathbf{v}_\Vert\\
&=\mathbf{u}\times\mathbf{v}
\end{aligned}
$$

代入可得

$$
\begin{aligned}
\mathbf{v}^\prime
&=(\mathbf{u}\cdot\mathbf{v})\mathbf{u}+\cos\theta(\mathbf{v}-(\mathbf{u}\cdot\mathbf{v})\mathbf{u})+\sin\theta(\mathbf{u}\times\mathbf{v})\\
&=\cos\theta\mathbf{v}+(1-\cos\theta)(\mathbf{u}\cdot\mathbf{v})\mathbf{u}+\sin\theta(\mathbf{u}\times\mathbf{v})
\end{aligned}
$$

# 四元数定义

对于所有四元数 $q\in\mathbb{H}$，都可以写成如下形式

$$
q=a+bi+cj+dk\quad(a,b,c,d\in\mathbb{R})
$$

其中$i^2=j^2=k^2=ijk=-1$，因此四元数不满足交换律。
另外，出于表记方便，四元数也可记为如下形式

$$
q=[s,\mathbf{v}]\quad(\mathbf{v}=(x,y,z)^T,s,x,y,z\in\mathbb{R})
$$

当 $s=0$ 时，$q$ 为纯四元数。
基于上述简单表记，可得四元数模长(normal)为

$$
\lVert q\rVert=\sqrt{s^2+\mathbf{v}\cdot\mathbf{v}}
$$

对于 $q_1=[s,\mathbf{u}]$ 和 $q_2=[t,\mathbf{v}]$ 加减法可记为

$$
q_1\pm q_2=[s\pm t,\mathbf{u}\pm\mathbf{v}]
$$

乘法则有

$$
q_1q_2=[st-\mathbf{u}\cdot\mathbf{v},s\mathbf{v}+tu+\mathbf{u}\times\mathbf{v}]
$$

也叫做Graßmann积。当 $q_1=[s,\mathbf{u}]$ 和 $q_2=[t,\mathbf{v}]$ 均为纯四元数时

$$
q_1q_2=[-\mathbf{u}\cdot\mathbf{v},\mathbf{u}\times\mathbf{v}]
$$

对于 $q=[s,\mathbf{v}]$，其共轭可定义为 $q^\ast=[s,-\mathbf{v}]$。验证可得

$$
\begin{cases}
qq^\ast=[s^2+\mathbf{v}\cdot\mathbf{v},\mathbf{v}\times-\mathbf{v}]=[s^2+\mathbf{v}\cdot\mathbf{v},0]=\lVert q\rVert^2\\
q^\ast q=\left(q^\ast\right)\left(q^\ast\right)^\ast=\lVert q^\ast\rVert^2=[s^2+(-\mathbf{v})\cdot(-\mathbf{v})]=\lVert q\rVert^2
\end{cases}
$$

因此 $qq^\ast=q^\ast q=\lVert q\rVert^2$。
在此定义任意四元数 $q$ 的逆为 $q^{-1}$，且满足 $qq^{-1}=1$。则可得

$$
\begin{aligned}
qq^{-1}=&1\\
q^\ast qq^{-1}=&q^\ast\\
q^{-1}=&\frac{q^\ast}{\lVert q\rVert^2}
\end{aligned}
$$

特别地，当 $q$ 为单位四元数，即 $\lVert q\rVert=1$时

$$
q^{-1}=q^\ast
$$

# 四元数与旋转

对于一般三维向量，可以将其视作一个纯四元数。

$$
(a,b,c)\to[0,(a,b,c)^T]
$$

从而便可从四元数的角度重新讨论三维空间的旋转。
首先规定四元数 $v$ 为带旋转量，$u$ 为转轴。
则基于纯四元数乘法

$$
\begin{aligned}
uv_\bot
=&[-\mathbf{u}\cdot\mathbf{v}_\bot,\mathbf{u}\times\mathbf{v}_\bot]\\
=&[0,\mathbf{u}\times\mathbf{v}_\bot]\\
=&\mathbf{u}\times\mathbf{v}_\bot
\end{aligned}
$$

结合 $\mathbf{v^\prime_\bot}=\cos\theta\mathbf{v_\bot}+\sin\theta(\mathbf{u}\times\mathbf{v_\bot})$ 可得

$$
v^\prime_\bot=\cos\theta v_\bot+\sin\theta uv_\bot
$$

令 $q=\cos\theta+\sin\theta u$，则有 $v^\prime_\bot=qv_\bot$。
此外，由于 $u$ 为纯四元数，所以 $q=[\cos\theta,\sin\theta\mathbf{u}]$。
即得知转轴与转角后构造旋转四元数的方式。

加之 $\mathbf{v}$ 的平行分量并不存在旋转，即 $v^\prime_\Vert=v_\Vert$，因此

$$
v^\prime=v_\Vert+qv_\bot
$$

同时，当 $q=[\cos\theta,\sin\theta\mathbf{u}]$，且 $\mathbf{u}$ 为单位向量时，易证

$$
q^2=qq=[\cos(2\theta),\sin(2\theta)\mathbf{u}]
$$

则可对 $v^\prime=v_\Vert+qv_\bot$ 进行下一步变形。

$$
\begin{aligned}
v^\prime
=&1\cdot v_\Vert+qv_\bot\\
=&pp^{-1}v_\Vert+p^2v_\bot
\end{aligned}
$$

不难得知 $p=\left[\cos\left(\frac12\theta\right),\sin\left(\frac12\theta\right)\mathbf{u}\right]$，
且 $\lVert p\rVert=1$，即 $p^{-1}=p^\ast$。代入可得

$$
v^\prime=pp^\ast v_\Vert+ppv_\bot
$$

在此将 $p^\ast$ 简记为 $[a,b\mathbf{u}]$，则有

$$
\begin{aligned}
p^\ast v_\Vert
=&[a,b\mathbf{u}]\cdot[0,\mathbf{v}_\Vert]\\
=&[-b\mathbf{u}\cdot\mathbf{v}_\Vert,a\mathbf{v}_\Vert+b\mathbf{u}\times\mathbf{v}_\Vert]\\
=&[-b\mathbf{u}\cdot\mathbf{v}_\Vert,a\mathbf{v}]\\
v_\Vert p^\ast
=&[0,\mathbf{v}_\Vert]\cdot[a,b\mathbf{u}]\\
=&[-v_\Vert\cdot b\mathbf{u},a\mathbf{v}_\Vert+\mathbf{v}_\Vert\times b\mathbf{u}]\\
=&[-\mathbf{v}_\Vert\cdot b\mathbf{u},a\mathbf{v}]\\
p^\ast v_\Vert=&v_\Vert p^\ast
\end{aligned}
$$

同样的，简记$p$ 为 $[a,b\mathbf{u}]$，则有

$$
\begin{aligned}
pv_\bot
=&[a,b\mathbf{u}]\cdot[0,\mathbf{v}_\bot]\\
=&[-b\mathbf{u}\cdot\mathbf{v}_\bot,a\mathbf{v}_\bot+b\mathbf{u}\times\mathbf{v}_\bot]\\
=&[0,a\mathbf{v}_\bot+b\mathbf{u}\times\mathbf{v}_\bot]\\
v_\bot p^\ast
=&[0,\mathbf{v}_\bot,a,-b\mathbf{u}]\\
=&[\mathbf{v}_\bot\cdot b\mathbf{u},a\mathbf{v}_\bot+\mathbf{v}_\bot(-b\mathbf{u})]\\
=&[0,a\mathbf{v}_\bot+b\mathbf{u}\times\mathbf{v}_\bot]\\
pv_\bot=&v_\bot p^\ast
\end{aligned}
$$

综合上述两条结论，

$$
\begin{aligned}
v^\prime
=&pp^\ast v_\Vert+ppv_\bot\\
=&pv_\Vert p^\ast+pv_\bot p^\ast\\
=&p(v_\Vert+v_\bot)p^\ast\\
=&pvp^\ast
\end{aligned}
$$

此外，由于每个旋转四元数 $q=[a,\mathbf{b}]$ 的实部都是某个角度的余弦值，因此可以通过如下方式获得旋转轴。

$$
\mathbf{u}=\frac{\mathbf{b}}{\sin(\cos^{-1}a)}
$$

另外，根据 $\cos(\pi-\theta)=\cos\theta$ 以及 $\sin(\pi-\theta)=\sin\theta$ 可知，
四元数 $q$ 和 $-q$ 对应的是同一个旋转变换。换言之

$$
(-q)v(-q)^\ast=(-1)^2qvq^\ast=qvq^\ast
$$

---

本文大量参考[此教程](https://krasjet.github.io/quaternion/quaternion.pdf)。
