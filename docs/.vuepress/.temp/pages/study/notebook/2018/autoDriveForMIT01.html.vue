<template><div><h1 id="无人驾驶麻省理工01讲" tabindex="-1"><a class="header-anchor" href="#无人驾驶麻省理工01讲" aria-hidden="true">#</a> 无人驾驶麻省理工01讲</h1>
<font color=red>2018-12-09 </font><p>PDF链接: <a href="https://whuteducn-my.sharepoint.com/:b:/g/personal/220077_whut_edu_cn/EUUMsVDo9yJAg9bWfz40jQsBuXFY13DTisylqQDg1nwyUQ?e=EGdbDD" target="_blank" rel="noopener noreferrer">麻省理工自动驾驶 MIT 6.S094第一讲<ExternalLinkIcon/></a></p>
<p>bilibili: <a href="https://www.bilibili.com/video/av23594594" target="_blank" rel="noopener noreferrer">麻省理工自动驾驶 MIT 6.S094第一讲<ExternalLinkIcon/></a></p>
<p><strong>写在前言：最近在学习麻省理工自动驾驶课程，本人在学习视频的同时写了一点学习笔记，有需要的童鞋可以参考一下。</strong></p>
<h2 id="_1-p15对于同一个问题的简单表达-如p16对于笛卡尔坐标系的分类-可以通过坐标变换在极坐标系中表达" tabindex="-1"><a class="header-anchor" href="#_1-p15对于同一个问题的简单表达-如p16对于笛卡尔坐标系的分类-可以通过坐标变换在极坐标系中表达" aria-hidden="true">#</a> （1）P15对于同一个问题的简单表达，如P16对于笛卡尔坐标系的分类，可以通过坐标变换在极坐标系中表达</h2>
<p>我觉得这一页写的非常好，在具体分析问题时，我们都是尽可能的把复杂问题简单化，视频中老师演示了日心说和地心说的例子，同时也展示了笛卡尔坐标系的平面变换。</p>
<p><img src="/image/autoDriveForMIT01/1683701632578.png" alt="1683701632578"></p>
<p><a href="http://www.365yg.com/i6632871765829747203/#mid=1619346472494083" target="_blank" rel="noopener noreferrer">日心说和地心说<ExternalLinkIcon/></a>
<img src="/image/autoDriveForMIT01/1683701655925.png" alt="1683701655925"></p>
<p>笛卡尔坐标系的平面变换</p>
<h2 id="_2-p22卷积计算的表达" tabindex="-1"><a class="header-anchor" href="#_2-p22卷积计算的表达" aria-hidden="true">#</a> （2）P22卷积计算的表达</h2>
<p>在实际神经网络中，我们面临的往往是一个“黑匣子”，即当下流行的各种训练框架，如TensorFlow、Pytorch、Keras等，都是基于封装好的接口。因此我每次和别人讲解卷积计算感觉特费劲，这个是我见过目前最好的例子了。</p>
<p><img src="/image/autoDriveForMIT01/1683701669617.png" alt="1683701669617"></p>
<p><a href="http://www.365yg.com/i6632863431642841613/#mid=1619346472494083" target="_blank" rel="noopener noreferrer">3D视频演示<ExternalLinkIcon/></a></p>
<h2 id="_3-p24神经网络的演示" tabindex="-1"><a class="header-anchor" href="#_3-p24神经网络的演示" aria-hidden="true">#</a> （3）P24神经网络的演示</h2>
<p>这个可以作为童鞋们写PPT的一大利器啊，我是不会网页的动画扣取。</p>
<p><img src="/image/autoDriveForMIT01/1683701687226.png" alt="1683701687226"></p>
<p><a href="https://appliedgo.net/perceptron/" target="_blank" rel="noopener noreferrer">神经网络激活<ExternalLinkIcon/></a></p>
<h2 id="_4-p30深度增强学习的演示" tabindex="-1"><a class="header-anchor" href="#_4-p30深度增强学习的演示" aria-hidden="true">#</a> （4）P30深度增强学习的演示</h2>
<p>其实增强学习当下已经研究的非常火热，这个实例其实也一般。</p>
<p><img src="/image/autoDriveForMIT01/1683701714092.png" alt="1683701714092"><img src="/image/autoDriveForMIT01/1683701701061.png" alt="1683701701061"></p>
<p><a href="http://www.365yg.com/i6632863436051055118/#mid=1619346472494083" target="_blank" rel="noopener noreferrer">增强学习<ExternalLinkIcon/></a></p>
<h2 id="_5-p38、p39、p40梯度典型问题" tabindex="-1"><a class="header-anchor" href="#_5-p38、p39、p40梯度典型问题" aria-hidden="true">#</a> （5）P38、P39、P40梯度典型问题</h2>
<p>如上所说，目前流行的深度学习框架只提供了很少的训练评估参数，但是对于研究神经网络具体的训练问题时，如梯度消失或者梯度死亡等常见的现象，我们只能是尽可能的调取其中可提供的参数进行观察，这几页很好的解决了我对梯度问题难以理解的痛点。</p>
<p><img src="/image/autoDriveForMIT01/1683701726199.png" alt="1683701726199"></p>
<p><a href="http://www.365yg.com/i6632871778764997134/#mid=1619346472494083" target="_blank" rel="noopener noreferrer">梯度问题01<ExternalLinkIcon/></a>
<a href="http://www.365yg.com/i6632871782967689735/#mid=1619346472494083" target="_blank" rel="noopener noreferrer">梯度问题02<ExternalLinkIcon/></a>
<img src="/image/autoDriveForMIT01/1683701750839.png" alt="1683701750839"></p>
<h2 id="_6-p44正则化防止过拟合的一种方法dropout" tabindex="-1"><a class="header-anchor" href="#_6-p44正则化防止过拟合的一种方法dropout" aria-hidden="true">#</a> （6）P44正则化防止过拟合的一种方法dropout</h2>
<p>这个方法我目前还没有接触，可能是我撸的代码不够多吧，先Mark一下。</p>
<p><img src="/image/autoDriveForMIT01/1683701760271.png" alt="1683701760271"></p>
<p><a href="http://www.365yg.com/i6632871774423876109/#mid=1619346472494083" target="_blank" rel="noopener noreferrer">正则化dropout<ExternalLinkIcon/></a></p>
<h2 id="_7-p46网站推荐" tabindex="-1"><a class="header-anchor" href="#_7-p46网站推荐" aria-hidden="true">#</a> （7）P46网站推荐</h2>
<p>很有趣的一个网站，可以帮助大家直观理解神经网络的操作流程。</p>
<p><img src="/image/autoDriveForMIT01/1683701782236.png" alt="1683701782236"></p>
<p><a href="http://playground.tensorflow.org/#activation=tanh&amp;batchSize=10&amp;dataset=circle&amp;regDataset=reg-plane&amp;learningRate=0.03&amp;regularizationRate=0&amp;noise=0&amp;networkShape=4,2&amp;seed=0.23279&amp;showTestData=false&amp;discretize=false&amp;percTrainData=50&amp;x=true&amp;y=true&amp;xTimesY=false&amp;xSquared=false&amp;ySquared=false&amp;cosX=false&amp;sinX=false&amp;cosY=false&amp;sinY=false&amp;collectStats=false&amp;problem=classification&amp;initZero=false&amp;hideText=false" target="_blank" rel="noopener noreferrer">神经网络的演示<ExternalLinkIcon/></a></p>
<h2 id="_8-p57图片分割分类" tabindex="-1"><a class="header-anchor" href="#_8-p57图片分割分类" aria-hidden="true">#</a> （8）P57图片分割分类</h2>
<p>这个感觉有点像U-net网络啊，不过又有点区别，这个侧重于提取更多的特征，很不错的思路。</p>
<p><img src="/image/autoDriveForMIT01/1683701821091.png" alt="1683701821091"></p>
<p><a href="https://adeshpande3.github.io/adeshpande3.github.io/A-Beginner's-Guide-To-Understanding-Convolutional-Neural-Networks/" target="_blank" rel="noopener noreferrer">图片分类<ExternalLinkIcon/></a></p>
<h2 id="_9-p61背景移除" tabindex="-1"><a class="header-anchor" href="#_9-p61背景移除" aria-hidden="true">#</a> （9）P61背景移除</h2>
<p>没试过这个操作，先放出链接吧。</p>
<p><img src="/image/autoDriveForMIT01/1683701833113.png" alt="1683701833113"></p>
<p><a href="https://towardsdatascience.com/background-removal-with-deep-learning-c4f2104b3157" target="_blank" rel="noopener noreferrer">背景移除<ExternalLinkIcon/></a></p>
<h2 id="_10-p71alphago-zero" tabindex="-1"><a class="header-anchor" href="#_10-p71alphago-zero" aria-hidden="true">#</a> （10）P71AlphaGo Zero</h2>
<p>大名鼎鼎的AlphaGo 啊，不过这个应该是变种版，增强学习现在都脱离经验的学习了，厉害。</p>
<p><img src="/image/autoDriveForMIT01/1683701846190.png" alt="1683701846190"></p>
<p><a href="http://www.365yg.com/i6632871770376372743/#mid=1619346472494083" target="_blank" rel="noopener noreferrer">AlphaGo Zero<ExternalLinkIcon/></a></p>
<h2 id="_11-p73奖励游戏" tabindex="-1"><a class="header-anchor" href="#_11-p73奖励游戏" aria-hidden="true">#</a> （11）P73奖励游戏</h2>
<p>坦白的说，这个游戏没看懂，不知道讲课老师怎么会迷恋上这种游戏。</p>
<p><img src="/image/autoDriveForMIT01/1683701855686.png" alt="1683701855686"></p>
<p><a href="http://www.365yg.com/i6632863427394011652/#mid=1619346472494083" target="_blank" rel="noopener noreferrer">奖励游戏<ExternalLinkIcon/></a></p>
<h1 id="写在最后" tabindex="-1"><a class="header-anchor" href="#写在最后" aria-hidden="true">#</a> 写在最后</h1>
<p>可能本文有很多童鞋会访问不了其中的一些网页，那么我就放出福利吧
<a href="https://github.com/Alvin9999/new-pac/wiki/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7" target="_blank" rel="noopener noreferrer">GitHub福利链接<ExternalLinkIcon/></a>
<a href="https://doub.io/sszhfx/" target="_blank" rel="noopener noreferrer">免费ssr账号<ExternalLinkIcon/></a></p>
</div></template>


