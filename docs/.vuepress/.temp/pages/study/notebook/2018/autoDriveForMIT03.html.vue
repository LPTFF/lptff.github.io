<template><div><h1 id="无人驾驶麻省理工03讲" tabindex="-1"><a class="header-anchor" href="#无人驾驶麻省理工03讲" aria-hidden="true">#</a> 无人驾驶麻省理工03讲</h1>
<font color=red>2018-12-15 </font><p>相关资料打包链接: <a href="https://whuteducn-my.sharepoint.com/:f:/g/personal/220077_whut_edu_cn/Es2eM_taTLZFkwlT-hbnkXABGafyJ10B19kd1Ltqijg9xA?e=dFowgK" target="_blank" rel="noopener noreferrer">麻省理工自动驾驶 MIT 6.S094第三讲<ExternalLinkIcon/></a></p>
<p>bilibili: <a href="https://www.bilibili.com/video/av23594594?p=3" target="_blank" rel="noopener noreferrer">麻省理工自动驾驶 MIT 6.S094第三讲<ExternalLinkIcon/></a></p>
<h1 id="深度增强学习" tabindex="-1"><a class="header-anchor" href="#深度增强学习" aria-hidden="true">#</a> 深度增强学习</h1>
<p>先放出无人驾驶的框架图</p>
<p><img src="/image/autoDriveForMIT03/1683702913884.png" alt="1683702913884"></p>
<p>从图上可以看出，深度增强学习是通过动作、反馈的奖励机制来进行网络模型的建立，在某种意义上，传感器的好坏直接决定了后面的工作质量，但是这一讲假定传感器是理想的，重点研究深度增强在模型中的运用。</p>
<h2 id="深度增强学习案例解说" tabindex="-1"><a class="header-anchor" href="#深度增强学习案例解说" aria-hidden="true">#</a> 深度增强学习案例解说</h2>
<p>P7主要是对图像、声音、行为的识别进行分析对比。以鸭子为例，提取鸭子的图像特征（边缘检测）和声音特征（共振峰）是容易的，因为只需要考察简单的行为特征，但是对于复杂的行为特征提取就困难了，因为会游泳的不仅仅是鸭子。P8机器人的增强学习，通过训练搬箱子的过程，让机器人更加熟练的搬运箱子，这个方法的主要优点就是利用机器人具有不知疲倦的功能，能够很好的解决一些单调重复性的工作。</p>
<p>P20有一个实例没见过，我画出了其示意图。</p>
<p><img src="/image/autoDriveForMIT03/1683702929543.png" alt="1683702929543"></p>
<p>P23老师还是挺贴心的，给出了马尔科夫随机分布的一个应用例子。</p>
<p><img src="/image/autoDriveForMIT03/1683702941296.png" alt="1683702941296"></p>
<p>总结一下，对于深度学习也好，增强学习也罢，都是基于贝叶斯先验分布的统计思想，同时还利用马尔科夫随机分布的原理，很好解决状态随着时间的变化而改变的问题（不懂的同学可以参考一下《随机过程》、《数理统计》的相关章节）</p>
<h2 id="deeptraffic仿真交通模型" tabindex="-1"><a class="header-anchor" href="#deeptraffic仿真交通模型" aria-hidden="true">#</a> DeepTraffic仿真交通模型</h2>
<p>这个是本节的重点。P15交通仿真模型，P16给了相关的链接，code亲测挂了，大家可以搜一下老师的GitHub用户名：lexfridman。P57至P83给出了该仿真交通模型的详细操作介绍，值得注意的是，部分功能只开放给MIT 学生使用。下面放出paper阅读笔记（食用方法：下载电子版论文后，直接翻译你感兴趣的段落即可）</p>
<p><img src="/image/autoDriveForMIT03/1683702952340.png" alt="1683702952340"></p>
<p><a href="https://selfdrivingcars.mit.edu/deeptraffic" target="_blank" rel="noopener noreferrer">DeepTraffic链接<ExternalLinkIcon/></a></p>
<h2 id="网络模型理论部分" tabindex="-1"><a class="header-anchor" href="#网络模型理论部分" aria-hidden="true">#</a> 网络模型理论部分</h2>
<p>这一部分偏向学术了，从简单理想模型开始分析（P25至P32机器人在房间里移动），然后进行数学推导（P36数值迭代，P45DQN算法），到仿真环境工作讲解，以及其中的细节部分讨论（P53蒙特卡罗）。整个过程主要是解决计划和动作的问题，采取奖赏的机制，即要求最大化奖赏，每一步的移动都会影响奖赏，然后通过深度学习去实现这个最佳策略。</p>
</div></template>


