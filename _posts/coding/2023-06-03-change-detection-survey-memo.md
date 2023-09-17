---
layout: post
title: 点群变化检测memo
tags: ComputerScience PointClouds
required: mermaid
---

- toc
{:toc}

This is a personal memo of this [survey paper](https://www.sciencedirect.com/science/article/pii/S0924271623000163).

# Introduction

<h5 style="text-align:center;"><u>Automatic change detection is an essential research subject.</u></h5>

Originated from *Photogrammetry* and *Remote sensing*.
- Image-based methods deduced 3D changes from 1D or 2D measurements.

*Point clouds* are promising.
- Can be obtained in a short time and a low cost
- Free from *perspective distortions*

<h5 style="text-align:center;"><u>Four major domains cover ten categories of application topics.</u></h5>

<table>
    <thead><tr>
        <th style="text-align:center;">Domains</th>
        <th style="text-align:center;">Categories</th>
    </tr></thead>
    <tbody>
        <tr>
            <td rowspan=4>Urban monitoring</td>
            <td>land use and land cover (LULC)</td>
        </tr>
        <tr><td>building investigation</td></tr>
        <tr><td>indoor variation analysis</td></tr>
        <tr><td>vegetation surveys</td></tr>
        <tr>
            <td rowspan=3>Construction automation</td>
            <td>construction monitoring</td>
        </tr>
        <tr><td>infrastructure maintenance</td></tr>
        <tr><td>historical heritage preservation</td></tr>
        <tr>
            <td rowspan=2>Hazard identification</td>
            <td>natural hazard monitoring</td>
        </tr>
        <tr><td>water body and flood monitoring</td></tr>
        <tr>
            <td>Cadaster</td>
            <td>cadaster updating</td>
        </tr>
    </tbody>
</table>

<h5 style="text-align:center;"><u>Three fundamental tasks must be addressed.</u></h5>

- Coordinate system alignment
- Spatial and spectral comparison
- Change representation and analysis

# Theoretical primer

<h5 style="text-align:center;"><u>Define and distinguish the term "change".</u></h5>

- Binary definition: changed / no change
- Triple definition: new / demolished / no change
- Additions for partial change: partially new / partially demolished

However, definitions above are not sufficient to describe some complicated situations.

<h5 style="text-align:center;"><u>Define "change" semantically at object-level.</u></h5>

From the aspect of one object, these types follow the natural and intuitive way of human observation.
- appeared / disappeared / fully moved
- partially moved / deformed
- unchanged

<h5 style="text-align:center;"><u>Change detection is still challenging.</u></h5>

1. Inconsistent sampling
    - Why? Point clouds with different *densities* / *distributions* / *covered regions*.
    - Solvable with comprehensive observation
1. Limited visibility
    - Why? Inevitable generation error due to *occlusion* / *perspective*.
1. Missing semantics
    - *Point cloud partition* is feasible in some cases.
    - *Semantics* are required for object-level analysis.

<h5 style="text-align:center;"><u>The general objective of change detection is twofold.</u></h5>

1. *Spatial changes* between two datasets at different timestamp from the same site.
1. *Change types* derived from spatial changes.

$$
\begin{gather}
P,Q\subset\mathbb{R}^3\\
\Downarrow\\
M=\{(p_i,q_i,d_i) | p_i\in P^\ast, q_i\in Q^\ast, d_i\in D_{p,q}\}\\
\Downarrow\\
L=E(D_{p,q})
\end{gather}
$$

- $P, Q$: input point clouds
- $P^\ast, Q^\ast$: overlapped subsets from $P, Q$
- $D_{p,q}$: spatial difference
- $E(\cdot)$: evaluation function
- $L$: change types

# General workflow

<h5 style="text-align:center;"><u>Change detection generally follows threes stages.</u></h5>

1. Reference frame registration: Point clouds are aligned into the same coordinate system for comparison.
1. Geometric difference estimation: Spatial differences obtained via occupancy analysis or distance measures.
1. Spectral and attribute analysis: Changes identified by analyzing geometric differences and attribute shifts.

<h5 style="text-align:center;"><u>1st: Reference frame registration</u></h5>

Reference frame registration is an *optimization problem* for estimating *transformation parameters* for point clouds without markers.

<div class="mermaid img-frame">
flowchart TD
    PC1("Point cloud 1")
    PC2("Point cloud 2")
    STEP1("Correspondence matching")
    STEP2("Transformation calculation")
    OUT("Transformation parameters")

    PC1 & PC2--> STEP1
    STEP1 --> STEP2 --> STEP1
    STEP2 --> OUT
</div>

Approaches can be divided into three primary classes:
- *Geometric-constraint*-based methods
- *Feature-similarity*-based methods
- *Global-information*-based methods

Deep-learning techniques are useful for:
- generating more *robust feature descriptions* than conventional methods
- estimating *transformation parameters* by embedding to the network

However, lack of training datasets limits the usage in large outdoor scenarios.

<h5 style="text-align:center;"><u>2nd: Spatial difference estimation</u></h5>

According to the estimation metric, there are three types of methods:
- Point-based difference estimation
- Voxel- or occupancy-grid-based difference estimation
- Segment- or object-based difference estimation

<h5 style="text-align:center;"><u>3rd: Geometric and attribute analysis</u></h5>

Two properties should be derived at this stage:
- Geometric property: change type, uncertainties, ...
- Attribute property: semantics, ...

# Discussion

<h5 style="text-align:center;"><u>Gaps remain between techniques and demands</u></h5>

- Dataset reliability: The complexity brought by pseudo-changes is noteworthy.
    - Pseudo-change: changes in non-investigated objects
        - seasonal changes of vegetation covers the surface of buildings
        - scaffolds during construction
        - ...
    - TODOs: remove the influence of pseudo-changes
        - shape completion methods
        - filtering methods
        - ...
- Result uncertainty: Occlusion is troublesome.
- Contributions of semantics: Geometric changes cannot present all possible changes in an observed scene.

<h5 style="text-align:center;"><u>Some directions are possible to fill up the gaps</u></h5>

- Multi-source point clouds
- Object-level semantics
- Collaboration with Computer Vision
