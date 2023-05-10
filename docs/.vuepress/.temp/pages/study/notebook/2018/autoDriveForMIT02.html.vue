<template><div><h1 id="无人驾驶麻省理工02讲" tabindex="-1"><a class="header-anchor" href="#无人驾驶麻省理工02讲" aria-hidden="true">#</a> 无人驾驶麻省理工02讲</h1>
<div style='color:red'>2018-12-09 </div>
<p>相关资料打包链接: <a href="https://whuteducn-my.sharepoint.com/:f:/g/personal/220077_whut_edu_cn/ErQbTLrw69xLr7uSGoyKLfcB0wnatT99IWidnrhy7elCHA?e=JuGaNq" target="_blank" rel="noopener noreferrer">麻省理工自动驾驶 MIT 6.S094第二讲<ExternalLinkIcon/></a></p>
<p>bilibili: <a href="https://www.bilibili.com/video/av23594594/?p=2" target="_blank" rel="noopener noreferrer">麻省理工自动驾驶 MIT 6.S094第二讲<ExternalLinkIcon/></a></p>
<p><strong>写在前言：上一篇介绍了无人驾驶和深度学习的心得，这一篇我想和大家分享一下自动驾驶的心得。</strong></p>
<h2 id="不同的自主驾驶方法" tabindex="-1"><a class="header-anchor" href="#不同的自主驾驶方法" aria-hidden="true">#</a> 不同的自主驾驶方法</h2>
<h3 id="p8、p9、p10、p11-两种人工智能策略" tabindex="-1"><a class="header-anchor" href="#p8、p9、p10、p11-两种人工智能策略" aria-hidden="true">#</a> P8、P9、P10、P11，两种人工智能策略</h3>
<p>以人为中心的自动驾驶和以AI系统为中心的自动驾驶，简单点就是说谁对驾驶主要负责。</p>
<h3 id="p14无人驾驶的社会期望" tabindex="-1"><a class="header-anchor" href="#p14无人驾驶的社会期望" aria-hidden="true">#</a> P14无人驾驶的社会期望</h3>
<p>这个视频没有找到，但是我感觉这种有点科幻了。。。</p>
<h3 id="p17软件系统框架图" tabindex="-1"><a class="header-anchor" href="#p17软件系统框架图" aria-hidden="true">#</a> P17软件系统框架图</h3>
<p>很好的一个软件系统解说图。<img src="/image/autoDriveForMIT02/1683701246968.png" alt="1683701246968"></p>
<h3 id="p29不同场景的驾驶策略" tabindex="-1"><a class="header-anchor" href="#p29不同场景的驾驶策略" aria-hidden="true">#</a> P29不同场景的驾驶策略</h3>
<p>第一种我理解的是那种AI辅助决策的，无人驾驶系统提供决方案供驾驶人员选择，是以驾驶人员的判断为决策中心；第二种AI则是完全AI决策，这个时候的AI系统不仅仅能够找到解决方案，还能够自主的解决问题。但是对也这两套系统，我觉得还是从安全的角度划分一下决策权限好一点，明显经验丰富的驾驶人员应该为最高权限，我还是不太愿意把自己的生命完全托付给AI。比较有意思的是，AI的决策时间远远小于人类的判断时间，或者说在做出理性决策的时间上，人类需要的时间会大于AI的决策时间，这个感觉可以给予AI系统一些比较确定或者通用的高级权限（如碰到行人或安全栏紧急刹车），从而达到及时保护驾驶人员的安全。另外，无人驾驶准确率不需要达到100%，在极端情况下将控制权转交给驾驶人员。</p>
<h2 id="传感器" tabindex="-1"><a class="header-anchor" href="#传感器" aria-hidden="true">#</a> 传感器</h2>
<p>普通雷达传感器便宜稳定，但是成像效果差；激光雷达成本高，但是成像效果好；照相机局限于光源良好的环境。</p>
<h2 id="无人驾驶商业公司产品" tabindex="-1"><a class="header-anchor" href="#无人驾驶商业公司产品" aria-hidden="true">#</a> 无人驾驶商业公司产品</h2>
<p>Waymo、Uber、Tesla、Audi A8</p>
<h2 id="人工智能和深度学习的应用场景" tabindex="-1"><a class="header-anchor" href="#人工智能和深度学习的应用场景" aria-hidden="true">#</a> 人工智能和深度学习的应用场景</h2>
<h3 id="p54动态识别" tabindex="-1"><a class="header-anchor" href="#p54动态识别" aria-hidden="true">#</a> P54动态识别</h3>
<p>此处应献上GitHub代码链接，嗯，找个时间复现一下。</p>
<p><a href="https://github.com/raulmur/ORB_SLAM2" target="_blank" rel="noopener noreferrer">GitHub直达链接<ExternalLinkIcon/></a></p>
<h3 id="p57deepvo演示" tabindex="-1"><a class="header-anchor" href="#p57deepvo演示" aria-hidden="true">#</a> P57DeepVO演示</h3>
<p>这个感兴趣的小伙伴可以在资料包里找到，我已经从国外搬运过来了。</p>
<h3 id="p73、p74、p75极端交通情况的决策" tabindex="-1"><a class="header-anchor" href="#p73、p74、p75极端交通情况的决策" aria-hidden="true">#</a> P73、P74、P75极端交通情况的决策</h3>
<p>这个选取了三个典型的交通状况，主要是考验AI系统对于安全策略的一个度量，如何规避危险交通行为、危险交通行为发生时应该采取何种策略、如何取得最佳行为策略等。</p>
</div></template>


