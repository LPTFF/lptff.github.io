const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/autoDriveForMIT01-WkDr8l4-.js","assets/vue-vendor-c7x-_rhk.js","assets/autoDriveForMIT02-CuSYrhPg.js","assets/autoDriveForMIT03-BH9MmQI8.js","assets/underwaterRobots01-CSIhBrsE.js","assets/autoDriveForMIT04-Cyz7XZsc.js","assets/underwaterRobots02-BeRQ-mQ-.js","assets/career-decision-system-Cp4UXE1f.js","assets/career-tools-evolution-CgMi92nF.js","assets/crypto-tools-evolution-DqLrRmgr.js","assets/fund-tools-evolution-DdbQnKP3.js","assets/information-tools-evolution-ir2dy4jS.js","assets/interview-knowledge-archive-C8iRLcl3.js","assets/interview-project-chain-CqXUVwum.js"])))=>i.map(i=>d[i]);
var T=Object.defineProperty,h=Object.defineProperties;var y=Object.getOwnPropertyDescriptors;var u=Object.getOwnPropertySymbols;var P=Object.prototype.hasOwnProperty,k=Object.prototype.propertyIsEnumerable;var p=(n,e,t)=>e in n?T(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t,d=(n,e)=>{for(var t in e||(e={}))P.call(e,t)&&p(n,t,e[t]);if(u)for(var t of u(e))k.call(e,t)&&p(n,t,e[t]);return n},m=(n,e)=>h(n,y(e));import{a as o}from"./index-BLVA2Uxz.js";const R=`---
title: "无人驾驶麻省理工01讲"
date: "2018-12-09"
slug: "autoDriveForMIT01"
category: "无人驾驶"
tags: ["自动驾驶", "深度学习"]
summary: "麻省理工自动驾驶 MIT 6.S094 第一讲学习笔记。"
cover: "/image/autoDriveForMIT01/1683701632578.png"
legacyPaths:
  - "/study/notebook/2018/autoDriveForMIT01.md"
  - "/study/notebook/2018/autoDriveForMIT01.html"
  - "/2018/12/09/自动驾驶麻省理工01/"
---

PDF链接: [麻省理工自动驾驶 MIT 6.S094第一讲](https://whuteducn-my.sharepoint.com/:b:/g/personal/220077_whut_edu_cn/EUUMsVDo9yJAg9bWfz40jQsBuXFY13DTisylqQDg1nwyUQ?e=EGdbDD)

bilibili: [麻省理工自动驾驶 MIT 6.S094第一讲](https://www.bilibili.com/video/av23594594)

**写在前言：最近在学习麻省理工自动驾驶课程，本人在学习视频的同时写了一点学习笔记，有需要的童鞋可以参考一下。**

## 1、P15对于同一个问题的简单表达

如P16对于笛卡尔坐标系的分类，可以通过坐标变换在极坐标系中表达我觉得这一页写的非常好，在具体分析问题时，我们都是尽可能的把复杂问题简单化，视频中老师演示了日心说和地心说的例子，同时也展示了笛卡尔坐标系的平面变换。

![1683701632578](/image/autoDriveForMIT01/1683701632578.png)

[日心说和地心说](http://www.365yg.com/i6632871765829747203/#mid=1619346472494083)
![1683701655925](/image/autoDriveForMIT01/1683701655925.png)

笛卡尔坐标系的平面变换

## 2、P22卷积计算的表达

在实际神经网络中，我们面临的往往是一个“黑匣子”，即当下流行的各种训练框架，如TensorFlow、Pytorch、Keras等，都是基于封装好的接口。因此我每次和别人讲解卷积计算感觉特费劲，这个是我见过目前最好的例子了。

![1683701669617](/image/autoDriveForMIT01/1683701669617.png)

[3D视频演示](http://www.365yg.com/i6632863431642841613/#mid=1619346472494083)

## 3、P24神经网络的演示

这个可以作为童鞋们写PPT的一大利器啊，我是不会网页的动画扣取。

![1683701687226](/image/autoDriveForMIT01/1683701687226.png)

[神经网络激活](https://appliedgo.net/perceptron/)

## 4、P30深度增强学习的演示

其实增强学习当下已经研究的非常火热，这个实例其实也一般。

![1683701714092](/image/autoDriveForMIT01/1683701714092.png)![1683701701061](/image/autoDriveForMIT01/1683701701061.png)

[增强学习](http://www.365yg.com/i6632863436051055118/#mid=1619346472494083)

## 5、P38、P39、P40梯度典型问题

如上所说，目前流行的深度学习框架只提供了很少的训练评估参数，但是对于研究神经网络具体的训练问题时，如梯度消失或者梯度死亡等常见的现象，我们只能是尽可能的调取其中可提供的参数进行观察，这几页很好的解决了我对梯度问题难以理解的痛点。

![1683701726199](/image/autoDriveForMIT01/1683701726199.png)

[梯度问题01](http://www.365yg.com/i6632871778764997134/#mid=1619346472494083)
[梯度问题02](http://www.365yg.com/i6632871782967689735/#mid=1619346472494083)
![1683701750839](/image/autoDriveForMIT01/1683701750839.png)

## 6、P44正则化防止过拟合

P44正则化防止过拟合的一种方法dropout，这个方法我目前还没有接触，可能是我撸的代码不够多吧，先Mark一下。

![1683701760271](/image/autoDriveForMIT01/1683701760271.png)

[正则化dropout](http://www.365yg.com/i6632871774423876109/#mid=1619346472494083)

## 7、P46网站推荐

很有趣的一个网站，可以帮助大家直观理解神经网络的操作流程。

![1683701782236](/image/autoDriveForMIT01/1683701782236.png)

[神经网络的演示](http://playground.tensorflow.org/#activation=tanh&batchSize=10&dataset=circle&regDataset=reg-plane&learningRate=0.03&regularizationRate=0&noise=0&networkShape=4,2&seed=0.23279&showTestData=false&discretize=false&percTrainData=50&x=true&y=true&xTimesY=false&xSquared=false&ySquared=false&cosX=false&sinX=false&cosY=false&sinY=false&collectStats=false&problem=classification&initZero=false&hideText=false)

## 8、P57图片分割分类

这个感觉有点像U-net网络啊，不过又有点区别，这个侧重于提取更多的特征，很不错的思路。

![1683701821091](/image/autoDriveForMIT01/1683701821091.png)

[图片分类](https://adeshpande3.github.io/adeshpande3.github.io/A-Beginner's-Guide-To-Understanding-Convolutional-Neural-Networks/)

## 9、P61背景移除

没试过这个操作，先放出链接吧。

![1683701833113](/image/autoDriveForMIT01/1683701833113.png)

[背景移除](https://towardsdatascience.com/background-removal-with-deep-learning-c4f2104b3157)

## 10、P71AlphaGo Zero

大名鼎鼎的AlphaGo 啊，不过这个应该是变种版，增强学习现在都脱离经验的学习了，厉害。

![1683701846190](/image/autoDriveForMIT01/1683701846190.png)

[AlphaGo Zero](http://www.365yg.com/i6632871770376372743/#mid=1619346472494083)

## 11、P73奖励游戏

坦白的说，这个游戏没看懂，不知道讲课老师怎么会迷恋上这种游戏。

![1683701855686](/image/autoDriveForMIT01/1683701855686.png)

[奖励游戏](http://www.365yg.com/i6632863427394011652/#mid=1619346472494083)
`,w=`---
title: "无人驾驶麻省理工02讲"
date: "2018-12-09"
slug: "autoDriveForMIT02"
category: "无人驾驶"
tags: ["自动驾驶", "传感器"]
summary: "麻省理工自动驾驶 MIT 6.S094 第二讲学习笔记。"
cover: "/image/autoDriveForMIT02/1683701246968.png"
legacyPaths:
  - "/study/notebook/2018/autoDriveForMIT02.md"
  - "/study/notebook/2018/autoDriveForMIT02.html"
  - "/2018/12/09/自动驾驶麻省理工02/"
---

相关资料打包链接: [麻省理工自动驾驶 MIT 6.S094第二讲](https://whuteducn-my.sharepoint.com/:f:/g/personal/220077_whut_edu_cn/ErQbTLrw69xLr7uSGoyKLfcB0wnatT99IWidnrhy7elCHA?e=JuGaNq)

bilibili: [麻省理工自动驾驶 MIT 6.S094第二讲](https://www.bilibili.com/video/av23594594/?p=2)

**写在前言：上一篇介绍了无人驾驶和深度学习的心得，这一篇我想和大家分享一下自动驾驶的心得。**

## 1、不同的自主驾驶方法

### 1.1、两种人工智能策略

P8、P9、P10、P11，以人为中心的自动驾驶和以AI系统为中心的自动驾驶，简单点就是说谁对驾驶主要负责。

### 1.2、P14无人驾驶的社会期望

这个视频没有找到，但是我感觉这种有点科幻了。。。

### 1.3、P17软件系统框架图

很好的一个软件系统解说图。![1683701246968](/image/autoDriveForMIT02/1683701246968.png)

### 1.4、P29不同场景的驾驶策略

第一种我理解的是那种AI辅助决策的，无人驾驶系统提供决方案供驾驶人员选择，是以驾驶人员的判断为决策中心；第二种AI则是完全AI决策，这个时候的AI系统不仅仅能够找到解决方案，还能够自主的解决问题。但是对也这两套系统，我觉得还是从安全的角度划分一下决策权限好一点，明显经验丰富的驾驶人员应该为最高权限，我还是不太愿意把自己的生命完全托付给AI。比较有意思的是，AI的决策时间远远小于人类的判断时间，或者说在做出理性决策的时间上，人类需要的时间会大于AI的决策时间，这个感觉可以给予AI系统一些比较确定或者通用的高级权限（如碰到行人或安全栏紧急刹车），从而达到及时保护驾驶人员的安全。另外，无人驾驶准确率不需要达到100%，在极端情况下将控制权转交给驾驶人员。

## 2、传感器

普通雷达传感器便宜稳定，但是成像效果差；激光雷达成本高，但是成像效果好；照相机局限于光源良好的环境。

## 3、无人驾驶商业公司产品

Waymo、Uber、Tesla、Audi A8

## 4、人工智能和深度学习的应用场景

### 4.1、P54动态识别

此处应献上GitHub代码链接，嗯，找个时间复现一下。

[GitHub直达链接](https://github.com/raulmur/ORB_SLAM2)

### 4.1、P57DeepVO演示

这个感兴趣的小伙伴可以在资料包里找到，我已经从国外搬运过来了。

### 4.1、极端交通情况的决策

P73、P74、P75，这个选取了三个典型的交通状况，主要是考验AI系统对于安全策略的一个度量，如何规避危险交通行为、危险交通行为发生时应该采取何种策略、如何取得最佳行为策略等。
`,M=`---
title: "无人驾驶麻省理工03讲"
date: "2018-12-15"
slug: "autoDriveForMIT03"
category: "无人驾驶"
tags: ["深度强化学习", "自动驾驶"]
summary: "麻省理工自动驾驶 MIT 6.S094 第三讲学习笔记。"
cover: "/image/autoDriveForMIT03/1683702913884.png"
legacyPaths:
  - "/study/notebook/2018/autoDriveForMIT03.md"
  - "/study/notebook/2018/autoDriveForMIT03.html"
  - "/2018/12/15/自动驾驶麻省理工03/"
---

相关资料打包链接: [麻省理工自动驾驶 MIT 6.S094第三讲](https://whuteducn-my.sharepoint.com/:f:/g/personal/220077_whut_edu_cn/Es2eM_taTLZFkwlT-hbnkXABGafyJ10B19kd1Ltqijg9xA?e=dFowgK)

bilibili: [麻省理工自动驾驶 MIT 6.S094第三讲](https://www.bilibili.com/video/av23594594?p=3)

## 1、深度增强学习

先放出无人驾驶的框架图

![1683702913884](/image/autoDriveForMIT03/1683702913884.png)

从图上可以看出，深度增强学习是通过动作、反馈的奖励机制来进行网络模型的建立，在某种意义上，传感器的好坏直接决定了后面的工作质量，但是这一讲假定传感器是理想的，重点研究深度增强在模型中的运用。

## 2、深度增强学习案例解说

P7主要是对图像、声音、行为的识别进行分析对比。以鸭子为例，提取鸭子的图像特征（边缘检测）和声音特征（共振峰）是容易的，因为只需要考察简单的行为特征，但是对于复杂的行为特征提取就困难了，因为会游泳的不仅仅是鸭子。P8机器人的增强学习，通过训练搬箱子的过程，让机器人更加熟练的搬运箱子，这个方法的主要优点就是利用机器人具有不知疲倦的功能，能够很好的解决一些单调重复性的工作。

P20有一个实例没见过，我画出了其示意图。

![1683702929543](/image/autoDriveForMIT03/1683702929543.png)

P23老师还是挺贴心的，给出了马尔科夫随机分布的一个应用例子。

![1683702941296](/image/autoDriveForMIT03/1683702941296.png)

总结一下，对于深度学习也好，增强学习也罢，都是基于贝叶斯先验分布的统计思想，同时还利用马尔科夫随机分布的原理，很好解决状态随着时间的变化而改变的问题（不懂的同学可以参考一下《随机过程》、《数理统计》的相关章节）

## 3、DeepTraffic仿真交通模型

这个是本节的重点。P15交通仿真模型，P16给了相关的链接，code亲测挂了，大家可以搜一下老师的GitHub用户名：lexfridman。P57至P83给出了该仿真交通模型的详细操作介绍，值得注意的是，部分功能只开放给MIT 学生使用。下面放出paper阅读笔记（食用方法：下载电子版论文后，直接翻译你感兴趣的段落即可）

![1683702952340](/image/autoDriveForMIT03/1683702952340.png)

[DeepTraffic链接](https://selfdrivingcars.mit.edu/deeptraffic)

## 4、网络模型理论部分

这一部分偏向学术了，从简单理想模型开始分析（P25至P32机器人在房间里移动），然后进行数学推导（P36数值迭代，P45DQN算法），到仿真环境工作讲解，以及其中的细节部分讨论（P53蒙特卡罗）。整个过程主要是解决计划和动作的问题，采取奖赏的机制，即要求最大化奖赏，每一步的移动都会影响奖赏，然后通过深度学习去实现这个最佳策略。
`,V=`---
title: "水下机器人的运动分析与建模"
date: "2018-12-09"
slug: "underwaterRobots01"
category: "水下机器人"
tags: ["机器人", "运动建模"]
summary: "水下机器人运动分析与建模学习笔记。"
cover: "/image/underwaterRobots01/1683700534763.png"
legacyPaths:
  - "/study/notebook/2018/underwaterRobots01.md"
  - "/study/notebook/2018/underwaterRobots01.html"
  - "/2018/12/09/水下机器人研究01/"
---

先放出框架图

![1683700534763](/image/underwaterRobots01/1683700534763.png)

对于水下机器人，一定要建立一个静止的坐标系（定系）和运动的坐标系（动系），这个是分析水下机器人的运动基础。

定系：越简单越好，一般建议起始点为静系，且水平面+重力坐标系为宜。

动系：水下机器人自身的坐标系，这个一般都是输入控制量给定的，而且对于某个时刻的水下机器人，相对定系的空间状态量是已知的，否则只能重新初始化为水平面+重力坐标系。

总结一下：

![1683700540642](/image/underwaterRobots01/1683700540642.png)

## 1、运动的分解和合成

观察选择以速度作为表述，输入选择以角速度作为表述。

## 2、力的分解和合成

涉及到流体的力学分析很麻烦，所以在只能选择低速状态下，这样就可以考虑流体力学的一阶泰勒展开式，对于高阶的受力可以忽略不计。

## 3、力矩问题

在输入设定的时候，通过设定的扭矩来达到相应运动变化，即受力平衡状况调节
`,C=`---
title: "无人驾驶麻省理工04讲"
date: "2019-01-12"
slug: "autoDriveForMIT04"
category: "无人驾驶"
tags: ["计算机视觉", "自动驾驶"]
summary: "麻省理工自动驾驶 MIT 6.S094 第四讲学习笔记。"
cover: "/image/autoDriveForMIT04/1683703412719.png"
legacyPaths:
  - "/study/notebook/2019/autoDriveForMIT04.md"
  - "/study/notebook/2019/autoDriveForMIT04.html"
  - "/2019/01/12/自动驾驶麻省理工04/"
---

相关资料打包链接: [麻省理工自动驾驶 MIT 6.S094第四讲](https://whuteducn-my.sharepoint.com/:b:/g/personal/220077_whut_edu_cn/Ea5iXqDY4Q5Og-Io6nAyUAYBM4ByRP4tgk2RIkq79QRLPg?e=JdssEk)

bilibili: [麻省理工自动驾驶 MIT 6.S094第四讲](https://www.bilibili.com/video/av23594594/?p=4)

## 1、计算机视觉

**写在前言：最近博客没怎么更新，“万事开头难，中间难，结尾难”，这个趋势可不好，嗯，要引以为戒。“行百里者半于九十”，与诸君共勉！**

## 2、数据集建立（以ImageNet为例）

一谈到神经网络或者深度学习，网上有很多关于这方面的资料介绍，不胜枚举。其中，关于计算机视觉的深度学习方法，基本都是以斯坦福大学李飞飞教授的课程cs231n为代表。

![1683703412719](/image/autoDriveForMIT04/1683703412719.png)

该图片引自斯坦福CS231n课程
课程直达链接：[斯坦福2017季CS231n深度视觉识别课程视频](https://www.bilibili.com/video/av13260183?from=search&seid=11756757080254052141)
在这里，我想分享的则是这样一个观点：对于基于图像的神经网络模型，先决条件需要建立一个数量庞大的数据集。
![1683703425738](/image/autoDriveForMIT04/1683703425738.png)

李飞飞在该演讲中介绍，基于传统的机器学习方法，无法更加准确、深入的教会计算机理解图片，为此他们发起了一个图片收集项目，全球数以万计的参与者为这个项目提供了丰富的图片资料，这也是后来我们熟知的ImageNet数据集。这个数据集完成后，李飞飞教授根据这个项目完成了很多惊人的成果，这也就是一开始我所强调的建立庞大数据集的必要性。
同样的，在MIT无人驾驶项目中，他们也同样开展了很多的实验数据收集，从而建立一个庞大的数据集，基于这些数据，得到的各种研究成果才会更加的可信。
![1683703436286](/image/autoDriveForMIT04/1683703436286.png)

麻省理工老师实测收集数据
那么又来了一个问题，我们为什么要花费庞大的精力去建设这么一个庞大的类似于数据库项目？这个根本原因其实就是取决于我们的数学工具手段。我们在机器学习或者深度学习的过程中可以发现，我们处理很多计算问题时，往往采取的是数理统计的思想方法，虽然计算式各不相同，但是基本思想并没有跳出这个藩篱。对于真实情况的认知，我们往往采取样本估计的方法更加容易实现，特别是很多无法用数学物理方程去描述的问题，采取经验公式的思路往往是行之有效的。
![1683703444466](/image/autoDriveForMIT04/1683703444466.png)

贝叶斯公式

## 3、图像欺骗问题

图像欺骗问题其实是一个非常值得思考的问题，在我的理解中，这其实是对于一个“环境”的分析问题。计算机是依赖于模型去完成对环境的认知，所以如果模型没有考虑到环境的复杂多样性，就会造成很大的认知失误。

![1683703452398](/image/autoDriveForMIT04/1683703452398.png)

亚马逊公司曾经开发一个人工智能招聘系统，但是被爆出该系统歧视女性
对于PPT中提到的伪装成猴子的图片（P14），有很多专家提出了很多解决办法，如图像分割的方法（P41)，因为机器总是在很小的区域能够识别出猫还是猴子，只要设置优先级就可以了。但是人类识别图像问题并不完全依赖于理性认知，也有感性认知，这也就是有专家学者在SRGAN算法得到的结论：人类更加青睐于纹理边缘特征而不是像素点分布。前面所提到的基本都是按照机器理解的像素方法，由此可见在计算机视觉问题上，教会机器理解图片，首先要做到的便是设计者提高自身对于“环境”的理解深度，而这对于模型设计的好坏是非常有必要的。
![1683703460288](/image/autoDriveForMIT04/1683703460288.png)

SRGAN算法：人类更加青睐于纹理边缘特征而不是像素点分布

## 4、卷积计算只用于图像特征问题

这个问题曾经困扰了我很久，在我学习的过程中，更多接触练习的都是卷积神经网络，去各种网站论坛公布的开源代码，发现能够实现的大型网络模型也就卷积神经网络（CNN）居多。但是这并不是说深度学习只有卷积神经网络，而我陷入这一尴尬的境地，主要是能够供我们学习的公共数据集也就是MNIST、ImageNet等常见的图像数据集，别的工程领域方面提供的数据集作为案例推荐入门的并不多。

![1683703471526](/image/autoDriveForMIT04/1683703471526.png)

神经网络模型大致一览
详细参考链接：[不同模型特点总结](https://blog.csdn.net/qq_35082030/article/details/73368962)
`,D=`---
title: "AI应用之水下机器人02"
date: "2019-04-26"
slug: "underwaterRobots02"
category: "水下机器人"
tags: ["人工智能", "机器人"]
summary: "AI 应用之水下机器人学习笔记。"
cover: "/image/underwaterRobots02/1683703712573.png"
legacyPaths:
  - "/study/notebook/2019/underwaterRobots02.md"
  - "/study/notebook/2019/underwaterRobots02.html"
  - "/2019/04/26/计算机技术应用之水下机器人02/"
---

相关资料打包链接: [AI应用之水下机器人](https://whuteducn-my.sharepoint.com/:f:/g/personal/220077_whut_edu_cn/EkoOUW1B3C9PgiqVEJ25sM4BI1AFSso1CblshRNbYsQ4Hg?e=dV5Ht7)

## 1、数据集采样

诈尸更新，另外声明一下，水下机器人技术研究更名为AI应用之水下机器人

## 2、视频图像

先放出水下照片吧

![1683703712573](/image/underwaterRobots02/1683703712573.png)

这张是实际测量获取的照片，可以发现在水下获取到的照片比较浑浊，特别是在没有光源的情况下，几乎很难发现目标障碍物。即使打开光源后，图片也得在近距离才能获取比较清晰的图像。

## 3、电机传感器

电机传感器的数据采集如下：

![1683703723368](/image/underwaterRobots02/1683703723368.png)

这张是在进行避障运动时记录的各个电机到运动状况，需要说明的是：我们的避障策略是人为操作，并不是程序设定，所以这些数据推荐做无监督学习。

## 4、声呐

没买，先占坑，后期补上
`,E=`---
title: "职业能力进化：从 BOSS 插件到职业决策系统"
date: "2026-08-28"
slug: "career-decision-system"
category: "产品方向"
tags: ["职业决策", "浏览器插件", "AI", "市场需求"]
summary: "以真实招聘市场为输入，让 AI 承担检索和知识加工，让人专注于机会选择、能力投资与职业结果。"
cover: "/img/logo.jpg"
legacyPaths: ["/boss-zhipin"]
---

这个方向不再把产品定义成“求职资料集合”或“自动投递工具”，而是：

> **以真实市场需求为输入的个人职业能力进化系统。**

浏览器插件位于 BOSS 等真实招聘现场，负责捕获当前 JD、公司、招聘者和搜索上下文；AI 负责阅读、提取、比较、检索和生成；人负责目标、取舍、投入与最终决定。

## 当前插件已经具备什么

现有扩展在 BOSS 页面中提供统计、原生筛选、职位卡、对话、日志、翻页和用户触发的投递能力，同时可以结构化观察：

- 职位名称、薪资、经验、学历、城市和技能标签；
- 公司名称、行业和基础信息；
- 招聘者身份与活跃度信号；
- 当前搜索词、城市和翻页上下文。

这些是职业决策系统的传感器，但还不是最终产品。功能多少不是核心，关键是它能否帮助用户做出更好的选择。

## 插件下一步应该回答什么

当用户打开一个职位时，首屏只需要回答四个问题：

1. 这是一个什么机会？
2. 对我是否值得，依据是什么？
3. 当前还缺哪些证据或信息？
4. 最小下一步是忽略、调研、收藏、改简历还是投递？

每次分析都应明确区分来源事实、AI 推断和未知信息，不能用一个模糊“匹配分”替代判断过程。

## 从求职动作升级为职业闭环

\`\`\`text
真实市场需求
→ 识别高价值机会
→ 对照个人项目与能力证据
→ 选择最值得补的缺口
→ AI 辅助学习、研究和表达
→ 形成项目、简历与沟通证据
→ 获得回复、面试和 Offer 反馈
→ 修正职业方向与判断规则
\`\`\`

求职只是这个系统的一次验证。长期价值来自持续知道市场需要什么、自己拥有什么、下一单位时间投入在哪里最值得。

## 内容资产放在哪里

过去的页面没有被粗暴删除，而是退出产品表层：

- [前端面试知识树](/blog/articles/interview-knowledge-archive)作为可检索知识资产；
- [项目证据与面试串联](/blog/articles/interview-project-chain)作为个人能力证据底稿；
- [LeetCode、技术论坛和 GitHub Trending](/blog/articles/career-tools-evolution)作为产品演进与历史资料归档。

博客负责保存长期知识和公开表达，底层资料供 AI 按具体机会调用。用户不再需要先浏览整个知识库，知识只在影响决策或行动时出现。

## 产品边界

- 插件不替用户决定职业目标；
- AI 不伪造简历证据、公司事实或岗位要求；
- 自动翻页、批量投递和沟通只是二级执行工具，不是产品主价值；
- 个人简历、项目经历、历史岗位和决策结果默认本地优先；
- 每条建议最终都要能被后续市场结果验证和修正。

这条路线的核心不是让 AI 帮人消费更多信息，而是让人的价值持续上移到问题选择和决策层。
`,I=`---
title: "从信息消费到职业决策：旧求职功能归档"
date: "2026-08-28"
slug: "career-tools-evolution"
category: "产品复盘"
tags: ["产品归档", "LeetCode", "GitHub Trending", "技术资讯"]
summary: "归档 LeetCode、技术论坛、GitHub Trending 和静态招聘列表，记录产品为何从内容聚合转向真实市场需求与 AI 决策辅助。"
cover: "/img/logo.jpg"
legacyPaths: ["/leetcode", "/tech-forum", "/github-trending"]
---

曾经的网站把 LeetCode、技术论坛、GitHub Trending 和招聘快照都做成了独立页面。它们看起来都和工作有关，却没有真正回答最重要的问题：**这条信息会怎样改变我的职业选择？**

现在这些页面正式退出一级产品，原地址统一进入本文。页面代码仍可从 Git 历史追溯，历史数据和采集器保留为冷资产，不再参与日常发布。

## LeetCode：随机刷题不等于能力投资

旧页面从 64 份本地 JSON 中随机展示题目，再跳转到原站答题或看答案。它降低了“开始刷一道题”的操作成本，却没有判断：

- 目标岗位是否真的考算法；
- 哪类题与当前机会最相关；
- 刷题是否比补项目证据更值得投入。

因此随机刷题页面停止维护。以后只有在具体 JD、笔试安排或能力缺口明确指向算法时，才由 AI 生成针对性训练计划。

## 技术论坛：停止维护通用信息流

旧技术论坛混排掘金、美团技术和 V2EX 快照。它提供了更多可读内容，却不能区分哪些内容与当前职业目标有关，也不能验证阅读是否产生了能力或结果。

这些来源仍可在需要时作为检索线索，但不会继续作为用户必须主动浏览的产品栏目。AI 应先从岗位需求识别问题，再按需查找官方文档、工程案例和社区观点。

## GitHub Trending：开发者注意力不是招聘需求

GitHub Trending 曾同时出现在首页标签、热门资讯和独立页面中。项目热度可以反映开发者注意力，却不能直接证明岗位数量、薪资或企业需求。

它以后最多只是职业分析中的弱信号：只有和真实 JD 频次、个人目标、项目机会结合时才有意义。

## 静态 BOSS 页面：归档信息列表，保留现场能力

旧 \`/boss-zhipin\` 页面只展示公开城市页生成的少量职位快照，再跳转到 BOSS。真正有价值的能力已经转移到浏览器插件：在用户浏览真实 JD 时捕获职位、公司、招聘者和搜索上下文。

因此静态列表不再维护，旧地址现在进入[职业决策系统介绍](/blog/articles/career-decision-system)。

## 留下什么

- 面试资料迁入[完整知识树](/blog/articles/interview-knowledge-archive)和[项目证据串联](/blog/articles/interview-project-chain)。
- 历史公司面试记录和知识索引迁入 \`src/data/career/\`，122 份细分面试原文继续保存在 \`src/data/findJobMarkDown/\`，不直接进入一级页面。
- 历史 LeetCode、资讯和 Trending 数据保留为冷资产，可被明确任务按需调用。
- 浏览器插件成为真实市场需求的入口。
- AI 负责检索、压缩、比较和知识加工。
- 人只把注意力留给目标、取舍、投入和最终决定。

产品接下来不再追求“聚合更多职业内容”，而是帮助个人把真实市场需求转化成可验证的能力增长。
`,x=`---
title: "从加密货币策略清单到真实交易复盘"
date: "2026-08-30"
slug: "crypto-tools-evolution"
category: "产品复盘"
tags: ["产品迭代", "加密货币", "交易复盘"]
summary: "归档旧加密货币分析页面：记录静态策略、推荐清单、购买跳转和导出为什么没有形成长期改进闭环。"
cover: "/img/logo.jpg"
legacyPaths: ["/cryptocurrency"]
---

旧加密货币分析页面正式退出一级产品。它曾把外部脚本生成的持仓、推荐币种和合约候选集中到一个表格页面，支持筛选、自动刷新、批量跳转和 Excel 导出。旧地址现在保留为这篇产品复盘。

## 它最初解决了什么

最初的需求是把分散的行情、持仓和策略结论搬到一个随时能打开的页面：

- 查看持仓收益、成本、市场价和数量；
- 阅读外部策略给出的是否交易、方向、金额和理由；
- 浏览推荐币种与合约候选；
- 快速跳到外部交易页面，或导出清单继续处理。

它确实降低了取数和切换页面的成本，也帮助验证了表格、筛选和策略字段怎样组织更容易浏览。

## 为什么停止继续维护

页面始终是一块静态策略布告栏。它不知道建议生成时采用了什么目标和约束，也不记录用户是否采纳、真实执行是否成交、最终结果如何，以及下一次应该修改哪条规则。

因此每次增加字段、推荐模块、筛选条件或展示样式，都只是让信息更丰富，没有形成：

\`\`\`text
事前计划 → 真实执行 → 结果 → 错误归因 → 修改规则 → 下一轮验证
\`\`\`

这个页面在 2025 年经历了多轮密集调整，却仍然需要人离开系统完成最重要的判断和反馈。继续美化只会重复旧基金工具从 V1、Plus 到精简版来回变化的路径。

## 留下什么

- 静态策略清单适合短期查看，不适合作为长期纪律产品；
- “推荐”与“购买跳转”不能替代事前规则、执行确认和结果复盘；
- 筛选和导出只有在明确的归档或核对任务中才有价值；
- 旧实现保留在 Git 历史中，需要追溯时仍可查看；
- 当前合约复盘原型只保留真实事实、确定性统计和本人规则对照，而且已经停止扩张。

旧页面的退出不是否定这些探索，而是停止把“更多策略信息”误当成“更好的长期决策”。
`,A=`---
title: "从静态清单到复盘系统：基金工具的五代演变"
date: "2026-08-23"
slug: "fund-tools-evolution"
category: "产品复盘"
tags: ["产品迭代", "投资工具"]
summary: "归档基金买入建议与三代持仓分析页面：回顾这四个被基金复盘助手全面替代的早期产品，记录从静态展示器到复盘操作系统的演变思考。"
cover: "/img/logo.jpg"
---

今天把导航专区里的四个老入口正式关闭了：**基金买入建议**、**基金持仓分析V1**、**基金持仓分析Plus**、**基金持仓分析**。它们已经远远落后于现在的[基金复盘助手](/investment)，继续留在导航里只会干扰选择。这篇文章作为产品演变的思考记录，替它们做一次体面的归档。

## 一、为什么会有这四个页面

2021 年前后我开始定投基金，当时的核心诉求很简单：**把"买什么、买多少"的结论搬到手机上随时能看**。这个阶段的所有设计都围绕一个模式——外部脚本定时计算，把结果写成静态 JSON，前端只负责展示。

### 基金买入建议（多策略版）

最早的一版。每只基金一张卡片，并列展示两套策略的结论：

- **DeepSeek 策略**：买入时机、买入金额、买入评分、目标收益、分析理由；
- **低吸买入计算策略**：作为对照参考，同样一套字段。

它的价值在于"结论可对照"——同一只基金两套策略给出不同建议时，反而逼着我去想分歧来自哪里。但它本质上是一个**只读布告栏**：数据什么时候更新、更新成什么样，页面完全没有话语权。

### 持仓分析 V1

第一代持仓工具，引入了"持仓 / 对冲 / 推荐"三组清单，每只基金带购买地址跳转，支持批量前往购买、批量导出。定位是**清单驱动的操作入口**——把"看建议"和"去执行"连了起来。

局限也很明显：清单是我手工维护的，持仓变了要改数据源，页面本身不感知任何变化。

### 持仓分析 Plus

在 V1 基础上补了"持仓情况"分析区块（买入价、现价、收益估算等），是这个系列里功能最全的一版，也是代码最重的一版。它试图回答"我现在赚了还是亏了"，但数据依然靠外部推送，分析的维度也是写死的——想换个角度看持仓，就得改代码重新生成 JSON。

### 持仓分析（精简版）

Plus 的减法版：只保留持仓和推荐两块，去掉批量操作。做这一版时的想法是"轻量够用"，但回头看，它和 Plus 解决的是同一个问题，只是展示密度不同——**同一代产品的两个变体，而不是一次演进**。

## 二、真正的分水岭：数据流反向

四个页面对比下来，它们共享同一个根本约束：

> 前端是静态 JSON 的展示器，不采集、不计算、不存储，更不参与复盘。

而基金复盘助手（Investment OS）把这条链路完全反向了：

| 维度 | 旧四件套 | 基金复盘助手 |
| --- | --- | --- |
| 数据来源 | 外部脚本推送 JSON | 浏览器扩展采集 + 脚本定时抓取，本地账本记账 |
| 分析能力 | 展示预计算结论 | 规则引擎（加减仓纪律、止盈止损、移动止损）实时计算 |
| 核心场景 | "现在买什么" | "过去做得怎么样、下次怎么办"（总览/复盘/持仓/纪律/待办/采集/明细） |
| 产品形态 | 单页面 | 工作台式的操作系统 |

回头看，旧四件套回答的是**买什么**，复盘助手回答的是**我怎么变好**。前者是信息消费，后者是能力积累——这才是产品真正立得住的差异，而不是界面好坏。

## 三、留下什么

- **双策略对照的思路活了下来**：复盘助手里"同一持仓多规则并出结论"的引擎设计，源头就是当年"DeepSeek 策略 + 低吸策略"并列展示的启发。
- **清单导出是伪需求**：批量购买/导出用得极少，因为真实决策不会在页面上一次性完成；复盘助手改成"待办"模式，一次只推进一个动作。
- **展示密度不等于产品迭代**：V1 → Plus → 精简版来回横跳，说明当时没想清楚要解决什么问题；直到把问题定义成"复盘"而不是"看建议"，迭代才有了明确方向。

## 四、归档说明

四个入口已从导航专区移除，旧地址（/message、/fundPilotV1、/fundPilotPlus、/fundPilot）统一重定向到本文。页面代码保留在仓库历史中，作为那个"把结论搬上手机"阶段的完整纪念。

2026-08-30，最后仍单独运行的旧持仓明细页 \`/fundHoldInfoMsg\` 也已直接删除。它没有并入基金复盘助手：真实持仓与纪律判断由 Investment Review 自己的可信数据链和本地 Ledger 负责，避免继续维护第二条远程 JSON 消费链。

如果你是从旧地址跳转过来的——欢迎体验[基金复盘助手](/investment)，它是这一路演变的最新答案。
`,_=`---
title: "从搜索入口和资讯聚合到 AI 按需获取"
date: "2026-08-28"
slug: "information-tools-evolution"
category: "产品复盘"
tags: ["高级搜索", "资讯归档", "AI", "信息成本"]
summary: "归档高级搜索与资讯文章页面，把检索、筛选、压缩和知识加工交给 AI，让人把注意力留给目标与决策。"
cover: "/img/logo.jpg"
legacyPaths: ["/advanced-search", "/newsArticle"]
---

网站曾把高级搜索和资讯文章做成两个独立入口：前者帮助拼接 Google 搜索条件，后者定时聚合 RSS 文章。它们都降低了一点操作成本，却仍要求人主动提出查询、筛选结果、阅读内容并判断是否值得投入。

现在两个页面正式退出一级产品，原地址统一进入本文。页面代码可从 Git 历史追溯，RSS 采集脚本作为历史能力保留，但不再参与日常构建和发布。

## 高级搜索：拼接查询不等于解决问题

旧页面提供关键词、标题、站点和来源限定，可以搜索 Telegram、V2EX、GitHub、知乎等站点。它解决的是“怎样把搜索语法写出来”，没有解决：

- 当前最值得调查的问题是什么；
- 哪些来源与目标决策真正相关；
- 搜索结果是否可靠、重复或过时；
- 新信息是否足以改变行动。

以后不再让人维护一组固定搜索入口。AI 根据具体目标生成检索计划、选择来源、交叉核对并压缩结果；人负责确认问题、证据标准和最终取舍。

## 资讯文章：更多内容不等于更多价值

旧资讯页面从白名单 RSS 汇总财经与投资文章，再展示标题、来源、时间和摘要。它能持续生产内容，却很容易把注意力变成日常消费：用户仍需逐篇阅读，且文章是否与当前持仓、规则或职业目标有关并不明确。

以后只有在一次真实决策需要外部证据时，才按需调用资讯来源。AI 负责检索、去重、总结和提出冲突证据，最终输出应关联到正在解决的问题，而不是形成另一个需要刷新的信息流。

## 留下什么

- 博客保留这段产品演化记录，并承接适合长期阅读的内容。
- RSS 采集器保留为手动研究工具，不再定时生成生产页面数据。
- 搜索语法和历史来源保留在 Git 历史中，需要时可以被明确任务复用。
- 浏览器现场、真实市场需求和个人数据成为 AI 获取上下文的入口。
- 人把注意力上移到目标、证据标准、资源配置和最终决定。

产品不再以“给人更多信息”为目标，而是帮助人用更少的信息成本做出更好的决定，并把决定转化为可验证的能力增长。
`,J=`---
title: "前端面试知识树归档"
date: "2026-08-28"
slug: "interview-knowledge-archive"
category: "职业资产"
tags: ["前端", "面试", "知识归档"]
summary: "从独立面试题页面迁入博客的完整前端知识树，用于检索和 AI 按岗位调用，不再作为一级求职产品。"
cover: "/img/logo.jpg"
legacyPaths: ["/interview"]
---

> 归档说明：这份资料原来由独立“面试题”页面展示。现在它作为个人职业知识资产保留在博客中；实际求职准备应从具体 JD 出发，由 AI 选择最值得准备的部分，而不是从头浏览全部题目。

[查看按项目场景串联的面试准备稿](/blog/articles/interview-project-chain) · [了解职业决策产品的新方向](/blog/articles/career-decision-system)

# HTML

1. HTML5新增特性； HTML5 为什么只需要写 \`<!DOCTYPE HTML >\`，而不需要引入 DTD ；HTML5 元素的分类； HTML5 有哪些新特性、移除了那些元素；如何处理 HTML5 新标签的浏览器兼容问题； HTML5 的 form 的自动完成功能是什么；HTML5 的离线储存怎么使用,工作原理能不能解释一下；HTML5 新增的表单元素有哪些；在 HTML5 中,哪个方法用于获得用户的当前位置；用于预格式化文本的标签是什么

2. \`<link>\`标签定义；\`<title>\`与 \`<h1>\`的区别；\`<img>\`的 title 和 alt 有什么区别；常用的 meta 标签；\`<head >\`标签中必不少的是哪些；\`<b> \`与 \`<strong>\` 的区别和 \`<i> \`与 \`<em>\` 的区别；\`<label> \`的作用是什么?是怎么用的；src和href的区别

3. 标准模式与兼容模式各有什么区别；实现不使用 border 画出 1 px 高的线,在不同浏览器的标准模式与怪异模式下都能保持一致的效果

4. 行内元素、块级元素、空（void）；行内元素定义；块级元素定义；行内元素与块级元素的区别； 空元素定义

5. DOCTYPE(⽂档类型) 的作⽤；DOCTYPE 的作用是什么；DTD 介绍；DHTML 是什么；文档的不同注释方式

6. 简述一下你对 HTML 语义化的理解；HTML语义化标签有哪些；SGML 、 HTML 、XML 和 XHTML 的区别；

7. 对 web 标准、可用性、可访问性的理解；Html 规范中为什么要求引用资源不加协议头http或者https

8. BOM 和 DOM 的区别；解释一下DOM操作(增删改查)及其不同点 ；怎样添加、移除、移动、复制、创建和查找节点；attribute 和 property 的区别是什么；DOMContentLoaded 事件和 Load 事件的区别

9. script标签中defer和async的区别；async 和 defer 的作用是什么?有什么区别?(浏览器解析过程)

10. 页面可见性(Page Visibility API) 可以有哪些用途；如何在页面上实现一个圆形的可点击区域

11. 页面导入样式时,使用 \`<link>\`和 \`@import\`有什么区别； \`<link>\`和 \`@import\`的区别

12. IE 各版本和 Chrome 可以并行下载多少个资源；介绍一下Chrome 中的 Waterfall

13. 扫描二维码登录网页是什么原理，前后两个事件是如何联系的

14. Flash、Ajax 各自的优缺点，在使用中如何取舍

15. 网页验证码是干嘛的，是为了解决什么安全问题

16. css reset 和 normalize.css 有什么区别

17. Canvas 和 SVG 有什么区别

18. disabled 和 readonly 的区别

19. 渐进增强和优雅降级的定义

20. iframe 有哪些优点和缺点

21. 怎么重构页面

22. picture、source 与响应式图片；img 的 loading、decoding、fetchpriority 属性

23. template、slot、dialog、details/summary 等 HTML5 语义与交互标签

24. preload、prefetch、preconnect、dns-prefetch 的区别与使用场景

25. Content-Security-Policy（CSP）是什么，如何通过 meta 或响应头配置

26. 无障碍（a11y）：ARIA 属性、role、alt 与 label 的关联、键盘可访问性

27. SEO 相关：title、meta description、canonical、结构化数据（JSON-LD）、语义化标签对爬虫的影响

28. 表单相关：novalidate、formaction、formenctype、input 的 type 新增类型（email、url、number、range、color、date 等）

29. 拖拽 API（draggable、dropzone、DataTransfer）；全屏 API；剪贴板 API

30. Web Components：Custom Elements、Shadow DOM、HTML Templates 基本概念

31. 媒体查询在 HTML 中的 link media；打印样式 @media print

32. 字符实体、HTML 实体编码；XSS 与 innerHTML 注入风险

33. 什么是 Quirks Mode 与 Standards Mode；如何触发怪异模式

34. data-* 自定义属性的作用与使用场景

35. 什么是 Content Editable；designMode 与 contentEditable 的区别

# CSS

1. 讲一下盒模型，普通盒模型和怪异盒模型有什么区别；介绍一下标准的 CSS 的盒子模型和低版本 IE 的盒子模型有什么不同的； 内联盒模型基本概念；如何去除 inline-block 元素间间距；li 与 li 之间有看不见的空白间隔是什么原因引起的，有什么解决办法

2. 几种常见的 CSS 布局；讲一下flex弹性盒布局；flex:1 是哪些属性的缩写，对应的属性代表什么含义；flexbox 布局的属性和使用场景；flex布局理解

3. BFC、IFC是什么；BFC 块级格式化上下文；对BFC的理解，如何创建BFC；块元素和行内元素区别是什么，常见块元素和行内元素有哪些；什么是包含块，对于包含块的理解；对 BFC 规范(块级格式化上下文 block formatting context)的理解；IFC 是什么；元素竖向的百分比设定是相对于容器的高度吗

4. 常见的水平垂直居中实现方案；CSS如何实现垂直居中，实现水平垂直居中，实现图片居中；如何居中 div；有一个高度自适应的 div，里面有两个 div，一个高度 100px，希望另一个填满剩下的高度；css 实现上下固定中间自适应布局；css 两栏布局的实现；css 三栏布局的实现

5. CSS常见的选择器有哪些；CSS选择器和优先级；CSS的优先级如何计算；CSS3新增特性；CSS可继承属性和不可继承属性；CSS 选择符有哪些；CSS 中哪些属性可以继承；CSS 优先级算法如何计算

6. 常见的CSS单位；长度单位px、em和rem的区别是什么；画一条0.5px的线；如何解决1px；使用 rem 布局的优缺点；设备像素、css 像素、设备独立像素、dpr、ppi 之间的区别

7. 浮动塌陷问题解决方法是什么；请解释一下为什么需要清除浮动以及清除浮动的方式；使用 clear 属性清除浮动的原理；zoom:1 的清除浮动原理；对于 hasLayout 的理解；layout viewport、visual viewport 和 ideal viewport 的区别；常用 hack 的技巧；

8. position 常用属性及其默认值是什么；position属性的值有哪些，各个值是什么含义；position 的值 relative 和 absolute 定位原点是什么； 绝对定位元素与非绝对定位元素的百分比计算的区别；display 、position 和 float的相互关系；absolute 的 containing block(包含块)计算方式跟正常流有什么不同

9. display的属性和作用；单行、多行文本溢出；隐藏元素的方法；隐藏元素的方式；display 有哪些值，说明他们的作用；解释一下CSS 里的 visibility 属性中 collapse ；隐藏元素的 background-image 到底加不加载；如何实现单行/多行文本溢出的省略(...)；常见的元素隐藏方式有哪些

10. 什么是margin重叠，如何解决；margin 重叠问题的理解；content 与替换元素的关系；margin:auto 的填充规则；margin 无效的情形；border 的特殊性；什么是基线和 x-height；line-height 的特殊性；vertical-align 的特殊性；overflow 的特殊性；无依赖绝对定位是什么；absolute 与 overflow 的关系；relative 的特殊性；margin 和 padding 分别适合什么场景使用；width:auto 和 width:100%的区别；为什么 height:100% 会无效；min-width、max-width 和 min-height、max-height 属性间的覆盖规则

11. 为什么要初始化 CSS 样式；使用 CSS 预处理器吗，介绍一下有哪些；CSS 优化、提高性能的方法有哪些；浏览器是怎样解析 CSS 选择器的；为什么不建议使用统配符初始化 css 样式；介绍一下Sass、Less 的区别是什么；什么是 CSS 预处理器/后处理器

12. 全屏滚动的原理是什么，用到了 CSS 的哪些属性待深入实践)；视差滚动效果，如何给每页做不同的动画（回到顶部，向下滑动要再次出现，和只出现一次分别怎么做）；overflow:scroll 不能平滑滚动的问题怎么处理；offsetWidth/offsetHeight,clientWidth/clientHeight 与 scrollWidth/scrollHeight 的区别

13. 经常遇到的浏览器的兼容性有哪些，解释一下原因及其解决方法；介绍一下移动端的布局媒体查询；什么是响应式设计，响应式设计的基本原理是什么，如何兼容低版本的 IE(待深入了解)；position:fixed在 android 下无效怎么处理

14. 简单介绍使用图片 base64 编码的优点和缺点；png、jpg、gif 、webp这些图片格式解释一下，分别什么时候用；浏览器如何判断是否支持 webp 格式图片

15. 实现一个三角形；用纯 CSS 创建一个三角形的原理是什么；实现一个宽高自适应的正方形；一个自适应矩形,水平垂直居中，且宽高比为 2:1；CSS 多列等高如何实现

16. ::before 和:after 中双冒号和单冒号有什么区别，解释一下这两个伪元素的作用；伪类与伪元素的区别；关于伪类 LVHA 的解释；CSS3 新增伪类有那些；伪类和伪元素的区别是什么

17. 如何修改 chrome 记住密码后自动填充表单的黄色背景；怎么让 Chrome 支持小于 12px 的文字；让页面里的字体变清晰，变细用 CSS 怎么做；font-style 属性中 italic 和 oblique 的区别；font-weight 的特殊性；text-indent 的特殊性； letter-spacing 与字符间距；word-spacing 与单词间距；white-space 与换行和空格的控制；一个满屏品字布局如何设计

18. CSS3 有哪些新特性(根据项目回答)；请解释一下 CSS3 的 Flex box(弹性盒布局模型)以及适用场景；简单说一下 css3 的 all 属性

19. 在网页中应该使用奇数还是偶数的字体，解释一下

20. 抽离样式模块怎么写

21. 如果需要手动写动画，你认为最小时间间隔是多久，为什么； transition 和 animation 的区别

22. 什么是 Cookie 隔离，请求资源的时候不要让它带 cookie 怎么做

23. style 标签写在 body 后与 body 前有什么区别

24. 阐述一下 CSSSprites

25. 什么是首选最小宽度

26. 什么是幽灵空白节点

27. 什么是替换元素；替换元素的计算规则

28. clip 裁剪是什么

29. 什么是层叠上下文；什么是层叠水平；元素的层叠顺序；层叠准则

30. 解释一下回流与重绘

31. 你知道 CSS 中不同属性设置为百分比\\x 时对应的计算基准

32. 回流和重绘

33. 盒模型

34. 有哪些CSS选择器

35. css优先级

36. css居中

37. 元素margin合并

38. BFC、IFC

39. block、inline和inline-block的元素有什么差别

40. display：none与visibility:hidden区别

41. 隐藏元素的方法

42. css画三角形

43. 盒模型盒子的宽度计算

44. 两种盒模型对比

45. 有哪些CSS选择器

46. css优先级

47. css优先级计算

48. div .div #div div>div>div优先级

49. class、id、tag 的优先级

50. 为什么不推荐用多层css选择器

51. css选择器处理

52. css居中

53. 多列等高布局

54. 元素margin合并

55. BFC、IFC

56. 如何清除浮动

57. block、inline和inline-block的元素有什么差别

58. display属性

59. 说说你对盒子模型的理解

60. css选择器有哪些？优先级？哪些属性可以继承

61. 说说em/px/rem/vh/vw区别

62. 说说设备像素、css像素、设备独立像素、dpr、ppi 之间的区别

63. css中，有哪些方式可以隐藏页面元素？区别

64. 谈谈你对BFC的理解

65. 元素水平垂直居中的方法有哪些？如果元素不定宽高呢

66. 如何实现两栏布局，右侧自适应？三栏布局中间自适应呢

67. 说说flexbox（弹性盒布局模型）,以及适用场景

68. 介绍一下grid网格布局

69. CSS3新增了哪些新特性

70. css3动画有哪些

71. 怎么理解回流跟重绘？什么场景下会触发

72. 什么是响应式设计？响应式设计的基本原理是什么？如何做

73. 如果要做优化，CSS提高性能的方法有哪些

74. 如何实现单行／多行文本溢出的省略样式

75. 如何使用css完成视差滚动效果

76. CSS如何画一个三角形？原理是什么

77. 让Chrome支持小于12px 的文字方式有哪些？区别

78. 说说对Css预编语言的理解？有哪些区别?

79. CSS 容器查询（container queries）与 @container；:has() 伪类及其应用场景

80. CSS 逻辑属性（margin-inline、padding-block 等）与书写模式

81. subgrid 是什么，解决什么问题

82. CSS 变量（自定义属性）的作用域与继承；与 Sass 变量的区别

83. will-change、contain、content-visibility 对渲染性能的影响

84. CSS 层（@layer）与 cascade layers 优先级规则

85. aspect-ratio、object-fit、object-position 的用法

86. filter、backdrop-filter、mix-blend-mode 的区别与性能注意点

87. CSS Grid 与 Flex 如何选择；grid-template-areas 布局

88. 移动端 1px 边框、安全区域 env(safe-area-inset-*)、viewport-fit=cover

89. CSS-in-JS、CSS Modules、Tailwind 等方案对比（工程化选型）

90. @supports 特性检测与渐进增强

# JS

1. js有哪些数据类型；数据类型判断方式有几种；解释一下es6新增symbol数据类型；typeof和instance of的区别；js有哪些判断类型的方法；JS 类型检测的方法 typeof、instanceOf 、Object.prototype.toString() 需要理解各个检查方法的输出；instanceof 运算符的实现原理及实现；typeof 和 instanceof 区别；NaN是什么，如何判断是否是NaN类型；null、undefined及未声明变量之间的区别，如何区分；null和undefined区别；map和Object的区别map和weakMap的区别；介绍 js 的基本数据类型；JavaScript 有几种类型的值?你能画一下他们的内存图吗；什么是堆?什么是栈?它们之间有什么区别和联系；undefined 与 undeclared 的区别；null 和 undefined 的区别；如何获取安全的 undefined 值；在 js 中不同进制数字的表示方式； js 中整数的安全范围是多少；typeof NaN 的结果是什么；isNaN 和 Number.isNaN 函数的区别；Array 构造函数只有一个参数值时的表现；其他值到字符串的转换规则；其他值到数字值的转换规则；其他值到布尔类型的值的转换规则；{} 和 [] 的 valueOf 和 toString 的结果是什么；substring和substr的区别；解析字符串中的数字和将字符串强制类型转换为数字的返回结果都是数字,它们之间的区别是什么；操作符什么时候用于字符串的拼接；什么情况下会发生布尔值的隐式强制类型转换；|| 和 操作符的返回值；Symbol 值的强制类型转换；== 操作符的强制类型转换规则；如何将字符串转化为数字,例如 '12.3'；如何将浮点数点左边的数每三位添加一个逗号,如 12000000.11 转化为『12,000,000.11』；如何判断一个对象是否属于某个类；instanceof 的作用;Symbol 类型的注意点; Object.is() 与原来的比较操作符 “===”、“==” 的区别;Set 和 WeakSet 结构；Map 和 WeakMap 结构；如何封装一个 javascript 的类型判断函数;如何判断一个对象是否为空对象

2. JS 模块化方案；CommonJS；CommonJS和ESM区别；AMD、CMD、UMD；ES6 module是编译时导出接口，CommonJS是运行时导出对象。ES6 module输出的值的引用，CommonJS输出的是一个值的拷贝。ES6 module语法是静态的，CommonJS语法是动态的。ES6 module导入模块的是只读的引用，CommonJS导入的是可变的，是一个普通的变量。ES6 module支持异步，CommonJS不支持异步；模块化开发怎么做； js 的几种模块规范；AMD 和 CMD 规范的区别；ES6 模块与 CommonJS 模块、AMD、CMD 的差异；requireJS 的核心原理是什么?(如何动态加载的?如何避免多次加载的?如何缓存的?)；JS 模块加载器的轮子怎么造,也就是如何实现一个模块加载器；require 模块引入的查找方式

3. 谈谈对原型链的理解；js如何实现继承（原型和原型链）；JS原型，原型链；实现继承的方式；实现寄生组合继承；JavaScript 原型,原型链? 有什么特点；js 获取原型的方法；Javascript 的作用域链；谈谈对闭包的理解，什么是闭包；闭包有哪些应用场景；闭包有什么缺点；如何避免闭包；闭包和作用域谈一下区别；JS作用域及作用域链/闭包（closure），常用场景举例说明；闭包和原型链谈一下区别；对作用域、作用域链的理解；对闭包的理解以及它的使用场景； JavaScript 继承的几种实现方式；寄生式组合继承的实现;什么是闭包,为什么要用它;使用闭包实现每隔一秒打印 1,2,3,4

4. 如何判断一个变量是否数组；判断数组的方式有哪些；如何实现数组拍平；如何实现数组去重；数组的遍历方法；数组的for Each和map方法有哪些区别；常用哪些方法去对数组进行增、删、改；如何判断是否为空数组；数组方法 push、pop、shift、unshift功能及返回值 ；对类数组对象的理解，如何转化为数组；数组有哪些原生方法；JavaScript 类数组对象的定义；数组和对象有哪些原生方法,列举一下；数组的 fill 方法；[,,,] 的长度；生成随机数的各种方法；如何实现数组的随机排序

5. 谈谈对js事件循环的理解；EventLoop；DOM事件流及事件委托机制；JS事件委托、事件冒泡；document的load事件和DOMContentLoaded事件之间的区别；请解释事件循环，调用堆栈和任务队列的区别；宏任务与微任务；IE和Firefox的事件机制有何区别，如何阻止冒泡；写一个通用的事件侦听器函数;事件是什么?IE 与火狐的事件机制有什么区别? 如何阻止冒泡;三种事件模型是什么;事件委托是什么；什么是 DOM 和 BOM；js 的事件循环是什么

6. 介绍JS有哪些内置对象；宿主对象和原生对象的区别；如何将arguments转为数组，对象的遍历方法；如何判断两个对象相等；为什么0.1+0.2 != 0.3，如何让其相等；==和===的区别；JS执行对象查找时，永远不会去查找原型的函数是哪个；JS有哪几种创建对象的方式；介绍 js 有哪些内置对象；内部属性 [[Class]] 是什么；Javascript 中,有一个函数,执行时对象查找时,永远不会去查找原型,这个函数是什么；

7. 说说你对Promise的理解；Promise方法；promise.all 和 promise.allSettled 区别；对async/await 的理解；async/await对比Promise的优势；谈谈对promise理解，手写 Promise和 Promise.all方法；Callback；什么是 Promise 对象,什么是 Promises/A 规范；手写一个 Promise

8. 什么是 Ajax；对AJAX的理解，实现一个AJAX请求；ajax、axios、fetch的区别；异步加载JS 的方式有哪些；js 延迟加载的方式有哪些；Ajax 是什么? 如何创建一个 Ajax；谈一谈浏览器的缓存机制；Ajax 解决浏览器缓存问题；同步和异步的区别;异步加载；异步编程的实现方式

9. for...in和for...of的区别；For 循环，for each和map的区别；forEach和.map()循环的主要区别，使用场景举例；如何使用for...of遍历对象；forEach和map方法有什么区别；["1 ", "2 ", "3 "].map(parseInt) 答案是多少;js for 循环注意点

10. javascript 创建对象的几种方式；使用new创建对象的过程是什么样的；new关键字；实现一个类似关键字new功能的函数；new操作符的实现原理；new 操作符具体干了什么呢?如何实现

11. this指向系列问题；解释一下JS执行上下文；请简述JS中的this ；解释一下JS变量和对象;谈谈 This 对象的理解;箭头函数和普通函数区别是什么；箭头函数和普通函数有什么区别

12. document.write和innerHTML有何区别；document.write 和 innerHTML 的区别；DOM 操作——怎样添加、移除、移动、复制、创建和查找节点；innerHTML 与 outerHTML 的区别；

13. call bind apply的区别；call,apply和bind的作用是什么；手写bind方法；请说明Function.prototype.bind的用法；call() 和 .apply() 的区别；手写 call、apply 及 bind 函数

14. Typescript中type和interface的区别是什么；讲讲Typescript中的泛型；Typescript如何实现一个函数的重载；type和interface的区别

15. 深拷贝、浅拷贝的区别；如何实现深拷贝和浅拷贝；object.assign和扩展运算法是深拷贝还是浅拷贝，两者区别；js 中的深浅拷贝实现;Object.assign();

16. ES next新特性有哪些；ES6 新语法/特性；ES6 Module；ES6知识点；ECMAScript6 怎么写 class,为什么会出现 class 这种东西

17. 柯里化是什么，有什么用，怎么实现；JS函数与函数式编程；高阶函数；函数柯里化的实现；谈一谈你理解的函数式编程

18. 对比 一下var、const、let；请解释变量提升；JavaScript 中的作用域与变量声明提升； let 和 const 的注意点

19. 什么是user strict，使用它有什么优缺点；javascript 代码中的 "use strict "; 是什么意思 ? 使用它区别是什么

20. 如何判断当前脚本运行在浏览器还是node环境中；如何判断当前脚本运行在浏览器还是 node 环境中?(阿里)

21. 解构赋值 const { a = 2 } = { a: null } const { a = 2 } = { a: undefined } 上面两个 a 的值是什么

22. 什么是尾调用，使用尾调用有什么好处；什么是 rest 参数；什么是尾调用,使用尾调用有什么好处

23. JS隐式转换及应用场景;匿名函数的典型应用场景；Attribute和Property的区别

24. 迭代器(iterator)接口和生成器(generator)函数的关系

25. 正则表达式；常用正则表达式

26. 立即执行函数；IIFE(立即执行函数)的用法；

27. any、unknown、never

28. 怎么优化 const value = a && a.b && a.b.c

29. 深入浅出JSBridge，从原理到使用

30. jQuery.extend和jQuery.fn.extend的区别；针对jQuery性能的优化方法

31. oAuth实现方案；如何实现单点登录(Single Sign On)

32. JS编码规范；说几条写 JavaScript 的基本规范

33. 什么是假值对象

34. ~ 操作符的作用

35. eval 是做什么的

36. 对于 JSON 的了解;开发中常用的几种 Content-Type;手写一个 jsonp

37. [].forEach.call($$("<em>"),function(a){a.style.outline="1px solid #" (~~(Math.random()</em>(1<<24))).toString(16)}) 能解释一下这段代码的意思吗？

38. 需求:实现一个页面操作不会整页刷新的网站,并且能在浏览器前进、后退时正确响应。给出你的技术实现方案

39. 移动端的点击事件的有延迟,时间是多久,为什么会有? 怎么解决这个延时

40. 如何测试前端代码么? 知道 BDD, TDD, Unit Test 么? 知道怎么测试你的前端工程么(mocha, sinon, jasmine, qUnit..)

41. 使用 JS 实现获取文件扩展名

42. escape,encodeURI,encodeURIComponent 有什么区别；Unicode 和 UTF-8 之间的关系

43. 为什么 0.1 0.2 != 0.3?如何解决这个问题

44. 原码、反码和补码的介绍

45. toPrecision 和 toFixed 和 Math.round 的区别;Math.ceil 和 Math.floor

46. Js 动画与 CSS 动画区别及相应实现；什么是 requestAnimationFrame

47. mouseover 和 mouseenter 的区别；js 拖拽功能的实现；

48. 为什么使用 setTimeout 实现 setInterval?怎么模拟

49. Reflect 对象创建目的

50. EventEmitter 实现

51. 一道常被人轻视的前端 JS 面试题

52. 如何确定页面的可用性时间,什么是 Performance API?

53. js 中的命名规则

54. js 语句末尾分号是否可以省略

55. 前端埋点的实现，说说看思路；怎么做 JS 代码 Error 统计

56. 箭头函数和普通函数有什么区别

57. 讲讲promise
58. apply、bind、call
59. typescript泛型
60. 实现防抖方法
61. 实现深拷贝和浅拷贝
62. 讲一下event loop
63. 如何判断数组
64. js数据类型
65. 什么是柯里化
66. 如何理解闭包
67. 如何理解原型与原型链
68. js继承
69. 类型判断
70. null和undefined的区别
71. new一个对象发生了什么
72. 手写promise

73. 实现Promise.all,Promise.race,Promise.any

74. 手写promise

75. 如何实现Promise.all、Promise.race和Promise.any方法。
76. Promise.all，Promise.race区别是什么？手写一个方法，使用Promise.all，实现所有都resolved/reject时才返回，并返回所有的结果
77. promise的catch后面跟一个then会怎么执行
78. callback改成promise
79. 如何理解js的作用域
80. 函数表达式和函数声明有什么区别
81. 讲一下变量提升（js预编译），为什么会有变量提升？
82. 讲讲promise，promise的3种状态和状态转换。Promise中回调函数是同步的还是异步的？then的链式调用是同步的还是异步的？
83. js如何判断一个变量是数组？
84. js数据类型都有哪些？
85. ==和===区别
86. 讲一下js中的包装类型
87. 讲一下js类型的隐式转换
88. typeof判断哪个类型会出错？Object.prototype.toString.call()判断哪个类型会出错？
89. typeof能判断函数吗？能判断null吗？
90. 如何判断一个对象为空
91. typeof和instanceof的区别
92. null和undefined有什么区别
93. 说说Javascript中的数据类型？区别
94. JavaScript数组的常用方法有哪些
95. Javascript字符串的常用方法有哪些
96. 谈谈 Javascript 中的类型转换机制
97. == 和 ===区别，分别在什么情况使用
98. 深拷贝浅拷贝的区别？如何实现一个深拷贝
99. 说说你对闭包的理解
100. 说说你对作用域链的理解
101. JavaScript原型，原型链 ? 有什么特点
102. Javascript如何实现继承
103. 谈谈this对象的理解
104. JavaScript中执行上下文和执行栈是什么
105. 说说JavaScript中的事件模型
106. typeof 与 instanceof 区别
107. 解释下什么是事件代理？应用场景
108. 说说new操作符具体干了什么
109. ajax原理是什么？如何实现
110. bind、call、apply 区别？如何实现一个bind
111. 说说你对正则表达式的理解？应用场景
112. 说说你对事件循环的理解
113. DOM常见的操作有哪些
114. 说说你对BOM的理解，常见的BOM对象你了解哪些
115. 举例说明你对尾递归的理解，有哪些应用场景
116. 说说 JavaScript 中内存泄漏的几种情况
117. Javascript本地存储的方式有哪些？区别及应用场景
118. 说说你对函数式编程的理解？优缺点
119. Javascript中如何实现函数缓存？函数缓存有哪些应用场景
120. 说说 Javascript 数字精度丢失的问题，如何解决
121. 什么是防抖和节流？有什么区别？如何实现
122. 如何判断一个元素是否在可视区域中
123. 大文件上传如何做断点续传
124. 如何实现上拉加载，下拉刷新
125. 什么是单点登录？如何实现
126. web常见的攻击方式有哪些？如何防御
127. JavaScript深入之从原型到原型链
128. JavaScript深入之词法作用域和动态作用域
129. JavaScript深入之执行上下文栈
130. JavaScript深入之变量对象
131. JavaScript深入之作用域链
132. JavaScript深入之从ECMAScript规范解读this
133. JavaScript深入之执行上下文
134. JavaScript深入之闭包
135. JavaScript深入之参数按值传递
136. JavaScript深入之call和apply的模拟实现
137. JavaScript深入之bind的模拟实现
138. JavaScript深入之new的模拟实现
139. JavaScript深入之类数组对象与arguments
140. JavaScript深入之创建对象的多种方式以及优缺点
141. JavaScript深入之继承的多种方式以及优缺点
142. JavaScript深入系列15篇正式完结！
143. JavaScript深入之浮点数精度
144. JavaScript深入之头疼的类型转换(上)
145. JavaScript深入之头疼的类型转换(下)
146. JavaScript专题之跟着underscore学防抖
147. JavaScript专题之跟着underscore学节流
148. JavaScript专题之数组去重
149. JavaScript专题之类型判断(上)
150. JavaScript专题之类型判断(下)
151. JavaScript专题之深浅拷贝
152. JavaScript专题之从零实现jQuery的extend
153. JavaScript专题之如何求数组的最大值和最小值
154. JavaScript专题之数组扁平化
155. JavaScript专题之学underscore在数组中查找指定元素
156. JavaScript专题之jQuery通用遍历方法each的实现
157. JavaScript专题之如何判断两个对象相等
158. JavaScript专题之函数柯里化
159. JavaScript专题之偏函数
160. JavaScript专题之惰性函数
161. JavaScript专题之函数组合
162. JavaScript专题之函数记忆
163. JavaScript专题之递归
164. JavaScript专题之乱序
165. JavaScript专题之解读 v8 排序源码
166. JavaScript专题系列20篇正式完结！
167. JavaScript专题之花式表示26个字母



# ES6

1. 说说var、let、const之间的区别
2. ES6中数组新增了哪些扩展
3. ES6中对象新增了哪些扩展
4. ES6中函数新增了哪些扩展
5. ES6中新增的Set、Map两种数据结构怎么理解
6. 你是怎么理解ES6中 Promise的？使用场景
7. 怎么理解ES6中 Generator的？使用场景
8. 你是怎么理解ES6中Proxy的？使用场景
9. 你是怎么理解ES6中Module的？使用场景
10. 你是怎么理解ES6中 Decorator 的？使用场景
11. ES6 系列之 let 和 const
12. ES6 系列之模板字符串
13. ES6 系列之箭头函数
14. ES6 系列之模拟实现 Symbol 类型
15. ES6 系列之迭代器与 for of
16. ES6 系列之模拟实现一个 Set 数据结构
17. ES6 系列之 WeakMap
18. ES6 系列之我们来聊聊 Promise
19. ES6 系列之 Generator 的自动执行
20. ES6 系列之我们来聊聊 Async
21. ES6 系列之异步处理实战
22. ES6 系列之 Babel 将 Generator 编译成了什么样子
23. ES6 系列之 Babel 将 Async 编译成了什么样子
24. ES6 系列之 Babel 是如何编译 Class 的(上)
25. ES6 系列之 Babel 是如何编译 Class 的(下)
26. ES6 系列之 defineProperty 与 proxy
27. ES6 系列之模块加载方案
28. ES6 系列之我们来聊聊装饰器
29. ES6 系列之私有变量的实现
30. ES6 完全使用手册

31. 可选链（?.）与空值合并（??）；与 ||、&& 的区别

32. BigInt 的使用场景与限制；globalThis 是什么

33. Promise.allSettled、Promise.any、Promise.finally 的区别与使用场景

34. 结构化克隆（structuredClone）与 JSON.parse/stringify 深拷贝对比

35. Array.at()、flatMap、findLast/findLastIndex；Object.hasOwn 与 hasOwnProperty

36. 动态 import() 与静态 import 的区别；import.meta 的用途

37. WeakRef、FinalizationRegistry 是什么（了解即可）

38. Temporal API、Record & Tuple（了解 Stage 提案即可）

39. 顶层 await 的使用条件与打包器支持

40. ArrayBuffer、TypedArray、DataView 的区别

41. 正则表达式 s、u 标志；命名捕获组

42. 私有字段 #private、静态块 static {}、类字段声明

# TypeScript

1. 说说你对 TypeScript 的理解以及与 JavaScript 的区别；TS 的优势、局限与适用场景

2. TypeScript 的数据类型有哪些；基本类型、联合类型、交叉类型、字面量类型

3. any、unknown、never、void、null、undefined 的区别与使用场景

4. type 和 interface 的区别；什么时候用 type，什么时候用 interface

5. 枚举（enum）的理解；const enum 与普通 enum 的区别；为什么不推荐滥用枚举

6. 泛型是什么；泛型约束（extends）、默认类型参数、泛型工具类型的编写

7. 常用工具类型：Partial、Required、Readonly、Pick、Omit、Record、Exclude、Extract、ReturnType、Parameters、Awaited 等

8. 高级类型：条件类型、infer、映射类型、索引访问类型、模板字面量类型

9. 类型断言（as）、非空断言（!）、类型守卫（typeof、instanceof、in、自定义 type predicate）

10. 函数类型：可选参数、默认参数、剩余参数、函数重载的声明与实现

11. 类：public/private/protected、readonly、抽象类、implements、装饰器（了解 Stage 3）

12. 命名空间（namespace）与 ES Module 的区别；Triple-Slash 指令

13. 声明合并（interface merging）；declare 关键字；.d.ts ambient 声明

14. 严格模式相关：strictNullChecks、noImplicitAny、strictFunctionTypes 等 compilerOptions

15. tsconfig.json 常见配置：target、module、moduleResolution、paths、baseUrl、skipLibCheck

16. 类型收窄与可辨识联合（discriminated union）

17. 协变与逆变（函数参数逆变）在 TS 中的体现（了解即可）

18. 如何在 Vue 项目中应用 TypeScript；vue-tsc、defineProps/defineEmits 类型

19. 如何在 React 项目中应用 TypeScript；FC、PropsWithChildren、事件类型

20. satisfies 运算符；const 类型断言（as const）

21. 类型体操常考题：DeepPartial、DeepReadonly、GetReturnType、TupleToUnion 等思路

22. anyScript 与类型安全的平衡；@ts-ignore、@ts-expect-error 的使用注意

# Node.js

1. Node.js 是什么；与浏览器 JavaScript 运行环境的区别

2. Node 事件循环与浏览器 Event Loop 的区别；process.nextTick、setImmediate、setTimeout 优先级

3. 单线程模型；为什么 Node 适合 I/O 密集型；CPU 密集型任务如何处理（worker_threads、子进程）

4. CommonJS 与 ES Module 在 Node 中的使用；require 与 import 的区别；__dirname、__filename 在 ESM 中的替代

5. 模块加载机制；require 查找规则；循环依赖如何处理

6. Buffer 是什么；与 TypedArray 的关系；编码（utf8、base64、hex）

7. Stream 流：Readable、Writable、Duplex、Transform；背压（backpressure）；pipe 与 pipeline

8. fs 模块：同步与异步 API；fs.promises；大文件读写与流式处理

9. path 模块常用方法；跨平台路径处理

10. http/https 模块创建服务；与 Express/Koa 的关系

11. Express 中间件机制；洋葱模型；错误处理中间件

12. Koa 与 Express 的区别；ctx 对象；为什么 Koa 需要 async/await

13. 中间件、路由、模板引擎、静态资源托管

14. 进程（child_process）：spawn、exec、fork 的区别与使用场景

15. cluster 模块多进程；PM2 的作用（进程守护、负载均衡、零停机重启）

16. 环境变量 process.env；dotenv；配置管理最佳实践

17. npm、yarn、pnpm 的区别；pnpm 为什么省磁盘、依赖如何隔离

18. package.json 中 dependencies、devDependencies、peerDependencies 的区别

19. npx 是什么；npm scripts 生命周期（pre/post）

20. Node 错误处理：Error 类型、uncaughtException、unhandledRejection

21. 调试 Node：--inspect、Chrome DevTools、VS Code 断点

22. 性能分析：clinic、0x、火焰图；内存泄漏排查

23. Node 安全：路径遍历、命令注入、原型污染；helmet、cors、rate-limit

24. JWT 认证流程；session 与 token 在 Node 服务中的实现思路

25. 文件上传：multer、分片上传、断点续传在服务端如何实现

26. WebSocket 在 Node 中的实现（ws、socket.io）

27. Redis 在 Node 中的常见用途：缓存、Session、分布式锁、消息队列

28. 消息队列：RabbitMQ、Kafka 在前端全栈中的角色（了解即可）

29. 数据库：MongoDB（Mongoose）与 MySQL（Sequelize/TypeORM）选型

30. RESTful API 设计规范；GraphQL 与 REST 对比（了解）

31. SSR 与 Node：Nuxt、Next 服务端渲染基本原理

32. Serverless、Edge Runtime、Deno/Bun 与 Node 的对比（了解）

33. ESM 的 import.meta.url；创建 __dirname 等价写法

34. util.promisify、events.EventEmitter 的使用场景

35. Node 版本管理：nvm、engines 字段、LTS 策略

# 浏览器

1. 事件流；浏览器的事件循环机制；浏览器下事件循环(Event Loop)；对浏览器事件循环的理解；Node.js的事件循环；Node和浏览器事件循环机制的区别；事件冒泡和捕获的区别；如何阻止事件冒泡；对事件委托的理解；执行顺序；process.nextTick；setImmediate 和 setTimeout;js 中倒计时的纠偏实现

2. 浏览器架构；说说浏览器渲染页面的过程；浏览器解析流程；从输入 url 到展示的过程；输入 URL 回车后经过哪些过程；当在浏览器中输入 URL 并且按下回车之后发生了什么；DNS完整的查询过程；浏览器架构；你对浏览器的理解；介绍一下你对浏览器内核的理解；常见的浏览器内核比较； 常见浏览器所用内核；浏览器的渲染原理；渲染过程中遇到 JS 文件怎么处理?(浏览器解析过程)；什么是文档的预解析?(浏览器解析过程)；CSS 如何阻塞文档解析?(浏览器解析过程)；渲染页面时常见哪些不良现象?(浏览器渲染过程)；如何优化关键渲染路径?(浏览器渲染过程)； 什么是重绘和回流?(浏览器绘制过程)；如何减少回流?(浏览器绘制过程)；为什么操作 DOM 慢?(浏览器绘制过程)；主流浏览器内核私有属性 css 前缀；浏览器的渲染过程；浏览器渲染优化；chrome的v8引擎属于渲染引擎么，举例说一下渲染引擎有哪些;把 script 标签放在页面的最底部的 body 封闭之前和封闭之后有什么区别?浏览器会如何解析它们

3. 垃圾回收机制；内存泄露；浏览器的垃圾回收机制；新生代（副垃圾回收器）；老生代（主垃圾回收器）；引用计数法；哪些情况会导致内存泄漏；Web Worker；讲讲js垃圾回收机制；JS内存空间的管理；如何编写高性能的 Javascript；简单介绍一下 V8 引擎的垃圾回收机制；哪些操作会造成内存泄漏；

4. 浏览器是怎么对 HTML5 的离线储存资源进行管理和加载的呢；常见的浏览器端的存储技术有哪些；数据存储；浏览器缓存浏览器的存储有哪些及它们间的区别；cookie和session的区别；本地存储方式 cookie、sessionStorage、localStorage 、indexedDB 各个存储方式的特点，以及使用场景；请描述一下 cookies,sessionStorage 和 localStorage 的区别；

5. 如何判断一个元素是否在可视区域中？ offsetTop、scrollTop getBoundingClientRect Intersection Observer

6. HTTP状态码；谈谈 HTTP 缓存 ；HTTP 缓存相关的知识，要了解浏览器请求什么时候会返回 disk cache、304、200；TCP 三次握手四次挥手的理解；HTTP 1.1 和 HTTP 2.0 的区别；HTTP 1.0/1.1/2.0/3.0 的特性；HTTP和HTTPS协议的区别；对HTTP请求中的keep-alive有了解吗；HTTP队头堵塞，TCP队头阻塞； get 请求传参长度的误区；URL 和 URI 的区别；get 和 post 请求在缓存方面的区别

7. OSI七层模型；TCP/IP五层协议；TCP和UDP的区别；UDP协议为什么不可靠；对 WebSocket 的理解；TCP和UDP的应用；GET和POST的请求的区别；POST和PUT请求的区别；

8. 网络安全；Web安全举例；HTTPS；WebSocket；token可以放在cookie里吗；什么是HTTPS协议，如何加密的；TLS/SSL的工作原理；XSS（跨站脚本攻击）；CSRF（跨站请求伪造）；什么是 XSS 攻击?如何防范 XSS 攻击；什么是 CSP；什么是 CSRF 攻击?如何防范 CSRF 攻击；什么是 Samesite Cookie 属性；什么是点击劫持?如何防范点击劫持；SQL 注入攻击；

9. 什么进程和线程，有什么区别；浏览器有哪些进程;进程间通信的方式

10. 为什么需要浏览器缓存；协商缓存和强缓存的区别

11. 常见浏览器所用内核；polyfill的作用；常见兼容性问题(移动端/PC端)；移动端屏幕适配；浏览器版本检测方式；功能检测、功能推断、navigator.userAgent的区别；webSocket 如何兼容低版本浏览器； 检测浏览器版本版本有哪些方式；什么是 Polyfill 

12. 跨标签页通讯；域名发散与域名收敛；什么是同源策略；如何解决跨越问题； 如何实现浏览器内多个标签页之间的通信；什么是浏览器的同源政策；如何解决跨域问题；服务器代理转发时,该如何处理 cookie；简单谈一下 cookie ；

13.  Cookie 和 SameSite 属性



# HTTP

1. 从输入url到看到界面的过程

2. http各个版本的改进

3. https的通信过程

4. https为什么是安全的

5. 前端性能优化方法

6. 网络攻击有哪些

7. 什么是HTTP? HTTP 和 HTTPS 的区别

8. 为什么说HTTPS比HTTP安全? HTTPS是如何保证安全的

9. 如何理解UDP 和 TCP? 区别? 应用场景

10. 如何理解OSI七层模型

11. 如何理解TCP/IP协议

12. DNS协议 是什么？说说DNS 完整的查询过程

13. 如何理解CDN？说说实现原理

14. 说说 HTTP1.0/1.1/2.0 的区别

15. 说说HTTP 常见的状态码有哪些，适用场景

16. 说一下 GET 和 POST 的区别

17. 说说 HTTP 常见的请求头有哪些? 作用

18. 说说地址栏输入 URL 敲下回车后发生了什么

19. 说说TCP为什么需要三次握手和四次挥手

20. 说说对WebSocket的理解？应用场景？

21. HTTP/3 与 QUIC 协议；与 HTTP/2 的主要区别

22. 对称加密与非对称加密；数字证书与 CA；HTTPS 握手过程（TLS 1.2/1.3 了解）

23. 正向代理与反向代理；Nginx 负载均衡策略（轮询、权重、ip_hash 等）

24. 跨域预检请求（OPTIONS）；简单请求与复杂请求的判断条件

25. Cookie 的 Secure、HttpOnly、SameSite、Domain、Path 属性

26. 缓存头完整梳理：Cache-Control、Expires、ETag、Last-Modified、Vary

27. 范围请求 Range、断点续传、206 Partial Content

28. 内容协商：Accept、Accept-Encoding、Accept-Language、Content-Encoding（gzip、br）

29. CORS 响应头 Access-Control-Allow-* 各字段含义

30. 短连接与长连接；HTTP Keep-Alive；连接复用与队头阻塞

31. REST、GraphQL、gRPC 在前端场景下的对比（了解）

32. 接口幂等性；GET/PUT/DELETE 的幂等；POST 如何保证幂等（Token、唯一键）

33. 限流、熔断、降级在前端与网关层的体现（了解）

# Vue 

1. 路由的钩子；vue-router的路由守卫；router和route的区别；路由传参和取参；路由钩子beforeEach三个参数；vue-router中的路由守卫有哪些；vue-router原理以及两种模式区别；vue-router用法；讲讲前端路由原理，比较一下history和hash这两种路由；前端有几种缓存方式；路由的hash和history模式的区别；router和route的区别；如何设置动态路由；路由守卫；vue-router 中的导航钩子函数；$route 和 $router 的区别；前端路由；什么是“前端路由”?什么时候适合使用“前端路由”?“前端路由”有哪些优点和缺点；Vue的路由实现:hash模式 和 history模式；Vue路由的钩子函数；vue-router原理以及两种模式区别

2. Virtual Dom（虚拟DOM）；diff 算法；Vue的diff算法；Vue的数据为什么频繁变化但只会更新一次；讲讲Vue的虚拟DOM原理以及好处是什么，相对于手动操作DOM性能更好吗；讲讲Vue diff算法；vue2中虚拟DOM更新时标记差异怎么实现的，介绍一下它的原理；对虚拟DOM的理解；虚拟DOM就一定比真实DOM更快吗；虚拟DOM的解析过程；DIFF算法原理；什么是 Virtual DOM?为什么 Virtual DOM 比原生 DOM 快；如何比较两个 DOM 树的差异

3. 常见的事件修饰符及其作用；常用的属性、指令有哪些；vue常用指令；v-for和v-if放在一起用好吗； v-if和v-show的区别；v-for和v-if同时使用有问题吗；vue如何实现自定义指令；v-html 的原理；v-model 是如何实现的，语法糖实际是什么；为什么v-for和v-if不能一起使用；vue 常用的修饰符；

4. vue响应式原理；vue响应式原理；vue的模板渲染；vue的compile过程；vue框架原理；为什么Vue是渐进式框架；Vuex工作机制；vue3中的ref、toRef、toRefs；Object.defineProperty 介绍；使用 Object.defineProperty() 来进行数据劫持有什么缺点；什么是 Proxy

5. 计算属性和监听属性；computed和watch的区别；vue组件watch中deep和immediate的作用；computed和method的区别；vue的computed和watch的实现原理；computed和watch区别是什么；vuex的使用；computed 和 watch 的差异；computed 和 watch 区别；vue computed和watch的区别

6. v-model原理；数据双向绑定原理；关于vue3双向绑定的实现；v-model的作用；vue数据双向绑定原理；讲讲Vue双向绑定原理；vue 双向数据绑定原理；Vue实现数据双向绑定的原理

7. Vue生命周期；vue组件的生命周期；vue父子组件挂载顺序；Vue父子组件生命周期触发顺序是怎样的；Vue 的生命周期是什么；Vue 的各个生命阶段是什么；Vue的生命周期；vue父子组件挂载顺序

8. vue的keep-alive组件；vue2中keep-alive怎么实现缓存效果的，它的原理是什么；说说Vue的keep-alive使用及原理；keep-alive 组件有什么作用；对keep-alive 的了解

9. 前端常用框架对比；React、Vue和JQuery的选型；vue和jquery的区别；vue和react的区别；vue和react的区别，有什么相同；Vue与Angular以及React的区别

10. 讲讲Vuex的使用方法；Vuex 的原理；Vuex中action和mutation的区别；Vuex 和 localStorage 的区别；Vuex是什么?怎么使用?哪种功能场景使用它

11. 组件通信；vue父子组件通信，兄弟组件通信；vue的event bus的实现；Vue组件间通信方式有哪些；Vue 组件间的参数传递方式；Vue组件间的参数传递

12. vue等待视图完成更新后进行下一次操作后，这个函数叫什么；process.nextTick和Vue.nextTick；vue异步渲染、nextTick；Vue.nextTick的实现

13. 实战技巧；vue怎么检测到数组的变化；vue2中响应式变量如何变成非响应式；vue组件样式污染；Vue如何给一个对象添加新的属性

14. vue中的data 为什么是个函数；vue组件data为什么是函数；vue组件data用箭头函数行不行；data为什么是一个函数而不是对象

15. 什么是 MVVM?比之 MVC 有什么区别?什么又是 MVP ；mvvm和mvc区别是什么；MVVM的理解；对于MVVM的理解

16. SPA的理解，有什么优缺点；SPA和多页面有什么区别；请解释SPA(单页应用)，优缺点是什么？如何使其对SEO友好

17. vue3的变化（改进）；composition Api对比 option Api的优势；Vue3和Vue2的区别；Vue2和Vue3有哪些区别

18. Vue中key的作用；为什么不建议用index作为key；vue 中 key 值的作用

19. Vue-cli如何新增自定义指令；Vue如何自定义一个过滤器

20. mixin 和 mixins 区别；vue 中 mixin 和 mixins 区别

21. 数据请求方面；Token怎么存

22. Vue.use方法的使用

23. Vue的性能优化有哪些
    - 编码阶段
    - 打包优化
    - 用户体验
    - SEO优化

24. slot

25. v-for和v-if放在一起用好吗

26. vue数据双向绑定原理

27. Vue的diff算法

28. vue nextTick

29. vue的keep-alive组件

30. vue父子组件通信,兄弟组件通信

31. mvvm与mvc

32. vuex的使用

33. vue-router中的路由守卫有哪些

34. vuex的使用

35. v-model的作用

36. vue框架原理

37. vue常用指令

38. Vue3和Vue2的区别

39. vue父子组件挂载顺序 

40. vue computed和watch的区别

41. vue组件data为什么是函数

42. vue组件data用箭头函数行不行

43. Vuex工作机制 

44. vue-router原理以及两种模式区别

45. vue-router用法

46. v-if和v-show的区别

47. v-for和v-if放在一起用好吗

48. vue组件样式污染

49. Vue如何给一个对象添加新的属性

50. vue响应式原理

51. vue的compile过程

52. vue的computed和watch的实现原理

53. vue的模板渲染

54. vue数据双向绑定原理

55. vue怎么检测到数组的变化

56. Vue的diff算法

57. vue nextTick

58. vue的keep-alive组件

59. Vue的数据为什么频繁变化但只会更新一次

60. process.nextTick和Vue.nextTick

61. vue组件watch中deep和immediate的作用

62. slot

63. vue异步渲染、nextTick 

64. vue如何实现自定义指令

65. Vue.use方法的使用

66. vue和react的区别

67. vue父子组件通信，兄弟组件通信

68. vue的event bus的实现

69. React、Vue和JQuery的选型

70. vue和jquery的区别

71. computed和watch的区别

72. computed和method的区别

73. vue组件的生命周期

74. 为什么Vue是渐进式框架

75. mvvm与mvc

76. 说说你对vue的理解

77. 说说你对双向绑定的理解

78. 说说你对SPA（单页应用）的理解

79. Vue中的v-show和v-if怎么理解

80. Vue实例挂载的过程中发生了什么

81. 说说你对Vue生命周期的理解

82. 为什么Vue中的v-if和v-for不建议一起用

83. SPA（单页应用）首屏加载速度慢怎么解决

84. 为什么data属性是一个函数而不是一个对象

85. Vue中给对象添加新属性界面不刷新

86. Vue中组件和插件有什么区别

87. Vue组件间通信方式都有哪些

88. 说说你对nextTick的理解

89. 说说你对vue的mixin的理解，有什么应用场景

90. 说说你对slot的理解？slot使用场景有哪些

91. Vue.observable你有了解过吗？说说看

92. 你知道vue中key的原理吗？说说你对它的理解

93. 怎么缓存当前的组件？缓存后怎么更新？说说你对keep-alive的理解是什么

94. Vue常用的修饰符有哪些？有什么应用场景

95. 你有写过自定义指令吗？自定义指令的应用场景有哪些

96. Vue中的过滤器了解吗？过滤器的应用场景有哪些

97. 什么是虚拟DOM？如何实现一个虚拟DOM？说说你的思路

98. 了解过vue中的diff算法吗？说说看

99. Vue项目中有封装过axios吗？怎么封装的

100. 你了解Axios的原理吗？有看过它的源码吗

101. SSR解决了什么问题？有做过SSR吗？你是怎么做的

102. 说下你的Vue项目的目录结构，如果是大型项目你该怎么划分结构和划分组件呢

103. Vue要做权限管理该怎么做？控制到按钮级别的权限怎么做

104. 跨域是什么？Vue项目中你是如何解决跨域的呢

105. Vue项目如何部署？有遇到布署服务器后刷新404问题吗

106. 你是怎么处理vue项目中的错误的

107. Vue3有了解过吗？能说说跟Vue2的区别吗？

108. Vue3.0的设计目标是什么？做了哪些优化

109. Vue3.0 性能提升主要是通过哪几方面体现的

110. Vue3.0里为什么要用 Proxy API 替代 defineProperty API

111. Vue3.0 所采用的 Composition Api 与 Vue2.x 使用的 Options Api 有什么不同

112. 说说Vue 3.0中Treeshaking特性？举例说明一下

113. 用Vue3.0 写过组件吗？如果想实现一个 Modal你会怎么设计？

114. Pinia 与 Vuex 的区别；为什么 Vue3 推荐 Pinia

115. Pinia 的 defineStore、state、getters、actions；与 Composition API 的配合

116. Vue3 script setup 语法；defineProps、defineEmits、defineExpose、withDefaults

117. ref、reactive、toRef、toRefs、shallowRef、shallowReactive 区别与使用场景

118. watch、watchEffect 的区别；watch 的 flush、deep 选项

119. provide/inject 跨层级通信；与 props、pinia 选型

120. Teleport、Suspense 组件的作用与使用场景

121. Vue3 自定义渲染器（了解）；compiler-dom 与 runtime-core 分层

122. effectScope 与组合式函数中的副作用清理

123. Vue3 响应式 API：effect、track、trigger 原理（了解）

124. 宏 auto-import、unplugin-vue-components 等工程化实践

125. Vue Router 4 与 3 的差异；createRouter、createWebHistory

126. Vite + Vue3 项目常见目录结构与规范

# React

1. React 是什么；与 Vue、Angular 的对比；声明式 UI、单向数据流、虚拟 DOM

2. JSX 是什么；为什么需要 Babel 编译；JSX 与 createElement 的关系

3. 类组件与函数组件的区别；为什么推荐函数组件 + Hooks

4. React 生命周期（类组件）：挂载、更新、卸载；componentDidMount、getDerivedStateFromProps 等

5. Hooks 规则：为什么不能在条件/循环中调用；Hooks 调用顺序为何重要

6. useState 原理与批量更新（batching）；函数式更新 setState(fn)

7. useEffect 与类组件生命周期的对应关系；依赖数组；清理函数 return

8. useLayoutEffect 与 useEffect 的区别；使用场景

9. useRef 与 useState 的区别；保存可变值、访问 DOM、避免闭包陷阱

10. useMemo、useCallback 的作用与滥用问题；何时真正需要优化

11. useContext 与 Context API；Provider/Consumer；性能注意点

12. useReducer 与 useState 选型；与 Redux 的关系

13. 自定义 Hook 的设计与复用（useRequest、useToggle 等）

14. React 18 新特性：并发渲染、自动批处理、startTransition、useDeferredValue

15. StrictMode 双重调用在开发环境的原因

16. 受控组件与非受控组件；表单处理；defaultValue 与 value

17. 合成事件（SyntheticEvent）与原生事件；事件委托在 React 17+ 的变化

18. 事件池（17 前）与 persist（了解历史即可）

19. setState 同步还是异步；React 18 中 setState 批处理行为

20. Fiber 架构是什么；可中断渲染、时间切片、双缓冲树

21. React 调度器（Scheduler）；优先级 Lane 模型（了解）

22. Diff 算法：单节点、多节点；key 的作用；为什么不建议用 index 作 key

23. 列表渲染 key；reconciliation 过程

24. 虚拟 DOM 一定更快吗；何时手动优化 DOM

25. React.memo、PureComponent 浅比较；children 导致重渲染

26. 状态提升、状态下沉、组合 vs 继承

27. 组件通信：props、回调、Context、状态管理库

28. Redux 三大原则；action、reducer、store；单向数据流

29. Redux 中间件；redux-thunk、redux-saga 区别

30. Redux Toolkit（RTK）：createSlice、configureStore、immer 集成

31. MobX、Zustand、Jotai、Recoil 与 Redux 对比（了解）

32. React Router：BrowserRouter vs HashRouter；路由参数、嵌套路由

33. 路由守卫在 React 中如何实现（封装 ProtectedRoute）

34. Code Splitting：React.lazy、Suspense、动态 import

35. Error Boundary 错误边界；getDerivedStateFromError、componentDidCatch

36. Portal 与 createPortal；模态框、Tooltip 挂载到 body

37. forwardRef 与 useImperativeHandle

38. Fragment、<> 短语法；为什么需要 key 的列表不能用 Fragment 省略 key 问题

39. 高阶组件（HOC）模式；render props；与 Hooks 对比

40. React 性能优化：memo、useMemo、useCallback、虚拟列表、windowing

41. 长列表优化：react-window、react-virtualized

42. 为什么要避免在 render 中创建新对象/函数作为 props

43. useEffect 无限循环的常见原因与修复

44. 闭包陷阱在 Hooks 中的体现；stale closure

45. React 与 TypeScript：组件 Props 类型、事件类型、泛型组件

46. React SSR：Next.js 基本原理；hydration、同构注意事项

47. React 18 Streaming SSR、Suspense on Server（了解）

48. CSS 方案：CSS Modules、Styled-components、Tailwind、CSS-in-JS 选型

49. React 测试：React Testing Library、Jest、快照测试

50. React 19 新特性了解：Actions、use、文档元数据等（按需）

51. fiber 与 Concurrent Mode 对用户体验的影响

52. 手写简易 useState、useEffect（面试常考）

53. 说说 React 设计思想：组合、单向数据流、声明式

# webpack

1. 对webpack的理解；webpack的构建流程；Webpack构建流程简单说一下；模块打包原理知道吗；文件监听原理呢；文件指纹是什么，怎么用；说一下 Webpack 的热更新原理吧；vite和webpack的区别；谈谈你对 webpack 的看法

2. webpack常见的优化方案；如何优化 Webpack 的构建速度；在实际工程中，配置文件上百行乃是常事，如何保证各个loader按照预想方式工作；Webpack的Tree Shaking原理；如何提高webpack的打包速度；vite比webpack快在哪里

3. 那你再说一说Loader和Plugin的区别，webpack中plugin和loader分别做什么，它们之间的执行顺序是怎样的；Webpack 常使用的 Loader 和 Plugin

4. 如何减少打包后的代码体积；如何对bundle体积进行监控和分析；bundle，chunk，module是什么；什么是Code Splitting

5. webpack配置有哪些；使用webpack开发时，你用过哪些可以提高效率的插件；聊一聊Babel原理吧；关于babel的理解

6. source map是什么；生产环境怎么用；Webpack的Source Map是什么，如何配置生成Source Map

7. 有哪些常见的Loader，你用过哪些Loader，是否写过Loader，简单描述一下编写loader的思路

8. 有哪些常见的Plugin，你用过哪些Plugin，是否写过Plugin，简单描述一下编写Plugin的思路

9. 说一下你对Monorepo的理解；你在项目是怎么做Monorepo；为什么pnpm快

10. webpack原理

11. webpack的tree-shaking

12. webpack优化

13. webpack的plugin和loader

14. 常见的webpack plugin和loader

15. webpack使用

16. webpack的splitChunks的使用

17. webpack原理

18. webpack的tree-shaking

19. require引入的模块webpack能做Tree-Shaking吗？

20. webpack如何动态加载

21. webpack能动态加载require引入的模块吗？

22. webpack优化

23. webpack模块热重载

24. happypack

25. webpack的plugin和loader

26. loader的加载顺序

27. 常见的webpack plugin和loader

28. 说说你对webpack的理解？解决了什么问题

29. 说说webpack的构建流程

30. 说说webpack中常见的Loader？解决了什么问题

31. 说说webpack中常见的Plugin？解决了什么问题

32. 说说Loader和Plugin的区别？编写Loader，Plugin的思路

33. 说说webpack的热更新是如何做到的？原理是什么

34. 说说webpack proxy工作原理？为什么能解决跨域

35. 说说如何借助webpack来优化前端性能

36. 如何提高webpack的构建速度

37. 与webpack类似的工具还有哪些？区别？

38. webpack 5 模块联邦（Module Federation）是什么；微前端场景

39. sideEffects 字段与 tree-shaking 的关系；package.json 如何标记无副作用

40. externals 配置；CDN 外链与 bundle 体积权衡

41. DllPlugin / DllReferencePlugin（webpack 4 常见，了解历史）

42. cache 持久化缓存（filesystem cache）；cache-loader、thread-loader

43. 环境变量 DefinePlugin、EnvironmentPlugin；dotenv-webpack

44. 打包分析：webpack-bundle-analyzer、速度分析 speed-measure-webpack-plugin

45. 开发环境 vs 生产环境配置拆分；webpack-merge

46. asset modules（webpack 5）替代 file/url/raw-loader

47. 如何处理 node_modules 中的 ES 模块与 CJS 混用

# Vite

1. Vite 是什么；与 Webpack 的核心区别（开发时用 esbuild 预构建 + 原生 ESM，生产用 Rollup）

2. 为什么 Vite 开发启动快；冷启动与 HMR 原理

3. Vite 的依赖预构建（optimizeDeps）解决什么问题；如何配置 include/exclude

4. Vite HMR API；import.meta.hot；边界模块更新

5. Vite 配置文件 vite.config.ts：root、base、server、build、plugins

6. Vite 插件机制；与 Rollup 插件的关系；常用插件（@vitejs/plugin-vue、react、legacy）

7. 环境变量 import.meta.env；.env、.env.development、.env.production

8. 路径别名 resolve.alias；与 tsconfig paths 配合

9. CSS 处理：CSS Modules、PostCSS、预处理器在 Vite 中的配置

10. 静态资源引用；public 目录与 assets 区别

11. 代码分割与动态 import；build.rollupOptions.output.manualChunks

12. 生产构建优化：rollup-plugin-visualizer、压缩、chunk 大小警告

13. SSR 与 Vite：vite-plugin-ssr、官方 SSR 指南思路

14. Vite 如何代理跨域 devServer.proxy

15. legacy 插件与浏览器兼容；@vitejs/plugin-legacy

16. Vite 与 Webpack 迁移注意点；为什么生产仍用 Rollup 打包

17. Vitest 与 Vite 的关系（单元测试基于 Vite）

18. 预渲染、SSG 在 Vite 生态中的方案（vite-ssg 等了解）

19. Worker 与 WebAssembly 在 Vite 中的支持

20. Monorepo 中使用 Vite（workspace、共享配置）

# Rollup

1. Rollup 是什么；与 Webpack 的定位区别（库打包 vs 应用打包）

2. Rollup 的 Tree-shaking 为什么通常更彻底；ESM 静态分析

3. 输入输出配置：input、output.format（es、cjs、umd、iife）

4. 插件机制；常用插件 rollup-plugin-node-resolve、commonjs、typescript、terser

5. external 外部依赖不打包；globals 在 UMD 中的映射

6. 多入口打包与 output.dir；preserveModules

7. Rollup 的 code splitting 与动态 import

8. 为什么 Vue 3、Vite 生产构建选用 Rollup

9. Rollup 与 Webpack 选型：库开发用 Rollup、复杂应用用 Webpack/Vite

10. watch 模式与 rollup -c 开发体验

11. 打包库的 package.json 字段：main、module、types、exports 条件导出

12. sideEffects 与 rollup treeshake 配置

13. @rollup/plugin-json、image、alias 等常用插件

14. Rollup 如何生成类型声明（配合 tsc 或 rollup-plugin-dts）

15. 与 esbuild、swc 在构建链中的分工（了解）

# 前端性能优化

1. 图片懒加载原理；前端需要注意哪些 SEO；前端性能优化 ；前端性能优化方案；图片的懒加载和预加载；

2. 节流和防抖；谈一下防抖、节流的概念；如何实现防抖和节流；介绍一下 js 的节流与防抖

3. SPA首屏为什么加载慢

4. 为什么要做性能优化

5. 常见性能优化有哪些关键指标

6. 性能优化方式有哪些：HTML & CSS、JS、Vue、Webpack优化、网络优化

7. 前端性能优化方法

8. 白屏和首屏时间

9. 浏览器渲染过程

10. js动画的性能问题

11. setTimeout和requestAnimationFrame的区别

12. 什么会阻塞dom渲染

13.  script标签什么情况不阻塞渲染

14. FP、FCP、FMP

15. 回流和重绘

16. 用户页面打开很慢，有哪些优化方式？

17. css和js加载，是同步还是异步？

18. Core Web Vitals：LCP、FID/INP、CLS 含义与优化手段

19. Performance API：performance.now、Navigation Timing、Resource Timing、LCP 观测

20. 关键渲染路径（CRP）优化 checklist

21. 资源优先级：preload、prefetch、preconnect 在性能优化中的实践

22. 骨架屏、占位符、渐进式图片（LQIP、blur-up）

23. 服务端渲染、静态生成、ISR 对首屏与 SEO 的影响

24. HTTP/2 多路复用、服务器推送（了解）与资源合并策略的变化

25. 长任务（Long Task）与 Total Blocking Time（TBT）

26. 内存与性能：Detached DOM、事件监听器未移除、定时器泄漏

27. Web Vitals 监控上报思路；RUM 与 Synthetic 监控区别

28. 打包体积优化：动态 import、按需加载、分析重复依赖、替换重型库

29. 图片格式选型 WebP/AVIF；responsive images；CDN 图片处理

30. 字体优化：font-display、子集化、预加载 woff2

31. 缓存策略分层：强缓存、协商缓存、Service Worker 缓存

32. 移动端性能：触摸延迟、300ms、passive 事件监听器

33. 离屏渲染、合成层过多问题；transform/opacity 动画优于 layout 属性

# 在线笔试题

1. js 实现一个函数,完成超过范围的两个大整数相加功能

2. js 如何实现数组扁平化

3. js 如何实现数组去重

4. 如何求数组的最大值和最小值

5. 如何求两个数的最大公约数

6. 如何求两个数的最小公倍数

7. 实现 IndexOf 方法

8. 判断一个字符串是否为回文字符串

9. 实现一个累加函数的功能比如 sum(1,2,3)(2).valueOf()

10. 使用 reduce 方法实现 forEach、map、filter

11. 设计一个简单的任务队列,要求分别在 1,3,4 秒后打印出 "1 ", "2 ", "3 "

12. 如何查找一篇英文文章中出现频率最高的单词

13. 如何检测浏览器所支持的最小字体大小

14. 一个列表,假设有 100000 个数据,这个该怎么办

15. 0.1 + 0.2 != 0.3原因是什么？

16. number类型最大值是多少？如果后台发的数据超过这个值怎么办？

17. 12和12.0有什么区别？

18. 实现每隔一秒输出数组中的一个数字

19. 为什么3.toString()会报错？

20. 代码的执行结果

    \`\`\`
    function Foo() {
      getName = function () {
        console.log(1)
      }
      console.log('this is ' + this)
      return this
    }
    
    
    Foo.getName = function () {
      console.log(2)
    }
    Foo.prototype.getName = function () {
      console.log(3)
    }
    var getName = function () {
      console.log(4)
    }
    function getName () {
      console.log(5)
    }
    
    
    Foo.getName();
    getName();
    Foo().getName();
    getName();
    new Foo.getName();
    new Foo().getName();
    new new Foo().getName();
    \`\`\`

21. 代码的执行结果

    \`\`\`
    window.name = 'ByteDance';
    function A () {
      this.name = 123;
    }
    A.prototype.getA = function(){
      console.log(this);
      return this.name + 1;
    }
    let a = new A();
    let funcA = a.getA;
    funcA();
    \`\`\`

22. 说出代码的执行结果？如果只改最后一行怎么让它也能输出aaa？

    \`\`\`
    var obj = { 
      name: 'aaa',
      getName: function() {
          console.log(this.name);
      }
    }
    var get = obj.getName;
    obj.getName();
    get();
    \`\`\`

23. 代码的执行结果

    \`\`\`
    var name = 'win';
    const obj = {
        name: 'obj',
        a: () => {
            console.log(this.name);
        }
    };
    const obj1 = {
        name: 'obj1'
    };
    obj.a.call(obj1);
    \`\`\`

24. 说出下面代码执行结果

    \`\`\`
    const promise = new Promise((resolve,reject)=>{
        console.log(1);
        resolve();
        console.log(2);
        reject()
    })
    setTimeout(()=>{console.log(5)},0)
    promise.then(()=>{console.log(3)})
    .then(()=>{console.log(6)})
    .catch(()=>{console.log(7)})
    console.log(4)
    \`\`\`

25. 说出代码执行结果

    \`\`\`
    const first = () => (new Promise((resolve, reject) => {
        console.log(3);
        let p = new Promise((resolve, reject) => {
            console.log(7);
            setTimeout(() => {
                console.log(5);
                resolve();
            }, 0);
            resolve(1);
        });
        resolve(2);
        p.then((arg) => {
            console.log(arg);
        });
    }));
    first().then((arg) => {
        console.log(arg);
    });
    console.log(4);
    \`\`\`

26. 说出代码执行结果

    \`\`\`
    console.log(1);
    new Promise(resolve => {
        resolve();
        console.log(2);
    }).then(() => {
        console.log(3);
    })
    setTimeout(() => {
        console.log(4);
    }, 0);
    console.log(5);
    \`\`\`

27. 说出代码执行结果

    \`\`\`
    Promise.resolve()
    .then(() => {
        console.log('1');
    })
    .then(() => {
        console.log('2');
    });
    
    
    setTimeout(() => {
        Promise.resolve()
        .then(() => {
            console.log('3');
        })
        .then(() => {
            console.log('4');
        });
        setInterval(() => {
            console.log('5');
        }, 3000);
        console.log('6');
    }, 0);
    \`\`\`

28. 说出代码执行结果

    \`\`\`
    setTimeout(function() {
        console.log(1);
    }, 0);
    console.log(2);
    async function s1() {
        console.log(7)
        await s2();
        console.log(8);
    }
    async function s2() {
        console.log(9);
    }
    s1();
    new Promise((resolve, reject) => {
        console.log(3);
        resolve();
        console.log(6);
    }).then(() => console.log(4))
    console.log(5);
    \`\`\`

29. 代码执行结果

    \`\`\`
    function fn() {
      return new Promise((resolve, reject) => {
          setTimeout(() => {
              reject('error');
          }, 1000);
      });
    }
    const foo = async () => {
       try {
         await fn();
      } catch (e) {
          console.log('lala', e);  // some error
      }
    }
    foo();
    \`\`\`

30. 循环打印数字

    \`\`\`
    for (var i = 0; i < 3; i++) {
        document.body.addEventListener(
            'click',
            function() {
                console.log(i);
            }
        )
    }
    \`\`\`

    上面代码输出什么？

    如果想0 1 2，怎么做？

31. 代码执行结果

    \`\`\`
    var count = 10;
    function a() {
     return count + 10;
    }
    function b() {
     var count = 20;
     return a();
    }
    console.log(b());
    \`\`\`

32. 说出代码执行结果

    \`\`\`
    // 代码段1
    console.log(a);
    a = 1;
    
    
    // 代码段2
    console.log(b);
    var b = 2; 
    
    
    // 代码段3
    var c = 1;
    let c;
    console.log(c);
    \`\`\`

33. 说出代码执行结果

    \`\`\`
    // 1
    var a = 10;
    function b() {
        a = 100;
    }
    b();
    console.log(a);
     
    // 2
    var a = 10;
    function b() {
        a = 100;
        function a() {};
    }
    b();
    console.log(a);
     
    // 3
    var a = 10;
    function b() {
        var a = 100;
    }
    b();
    console.log(a);
    
    
    // 4
    var resource = ['a.png', 'b.png', 'c.png', 'd.png', 'e.png', 'f.png'];
    for(var i = 0; i < resource.length; i++) {
        var img = new Image();
        img.src = resource[i];
        img.onload = function(){
            console.log(i);
        }
    }
    \`\`\`

30. 代码执行结果

    \`\`\`
    var a = {
        name:1,
        age:2,
    }
    var b = a;
    b.name = 3；
    
    
    console.log(a);
    console.log(b);
    \`\`\`

31. 代码执行结果

    \`\`\`
    const o1 = {};
    const o2 = {};
    console.log(o1 == o2);
    console.log(o1 === o2);
    \`\`\`

32. 代码执行结果

    \`\`\`
    [] + []
    [] + ![]
    [] == ![]
    [] == []
    \`\`\`

33. 代码执行结果

    \`\`\`
    null == 0
    null > 0
    null < 0
    null >= 0
    null <= 0
    \`\`\`

34. 代码执行结果

    \`\`\`
    let num = 10;
    function ch(num) {
        num = 12;
    }
    ch(num);
    console.log(num);
    
    
    
    let obj = {};
    function ch1(obj) {
        obj.a = 'a';
    }
    ch1(obj);
    console.log(obj.a);
    \`\`\`

34. 
35. 


# 其他

1. 类组件的生命周期，函数组件使用哪些hook来代替的哪些生命周期

2. 对于Fiber架构理解

3. 前端权限设计思路

4. 微前端

5. 前端低代码的认识

6. 常用的git命令

7. git rebase和git merge的区别

8. 设计模式的最基本原则

9. 使用过哪些设计模式 前端开发中用的比较多的就是策略模式、单例模式、发布订阅、外观模式

10. 那堆和栈的概念有什么区别呢

11. 单例模式模式是什么；策略模式是什么；代理模式是什么；中介者模式是什么；适配器模式是什么；观察者模式和发布订阅模式有什么不同；发布订阅模式的实现；手写一个观察者模式

12. react fiber

13. react diff算法

14. 函数式组件和类组件的区别

15. React性能优化

16. React列表的key

17. useState和userRef

18. 常用的hook

19. 说说你对版本管理的理解？常用的版本管理工具有哪些

20. 说说你对Git的理解

21. 说说Git中 fork, clone,branch这三个概念，有什么区别

22. 说说Git常用的命令有哪些

23. 说说Git 中 HEAD、工作树和索引之间的区别

24. 说说对git pull 和 git fetch 的理解？有什么区别

25. 说说你对git stash 的理解？应用场景

26. 说说你对git rebase 和 git merge的理解？区别

27. 说说 git 发生冲突的场景？如何解决

28. 说说你对git reset 和 git revert 的理解？区别？

29. 说说你对操作系统的理解？核心概念有哪些

30. 说说什么是进程？什么是线程？区别

31. 说说 linux系统下 文件操作常用的命令有哪些

32. 说说 linux 系统下 文本编辑常用的命令有哪些

33. 说说你对 linux 用户管理的理解？相关的命令有哪些

34. 说说你对输入输出重定向和管道的理解？应用场景

35. 说说你对 shell 的理解？常见的命令

36. 说说对设计模式的理解？常见的设计模式有哪些

37. 说说你对单例模式的理解？如何实现

38. 说说你对工厂模式的理解？应用场景

39. 说说你对策略模式的理解？应用场景

40. 说说你对代理模式的理解？应用场景

41. 说说你对发布订阅、观察者模式的理解？区别

42. Pinia 与 Vuex 的区别；Vue3 状态管理选型

43. 微前端：qiankun、single-spa、Module Federation 方案对比

44. 前端工程化：ESLint、Prettier、Husky、lint-staged、commitlint

45. CI/CD 基本概念；GitHub Actions / Jenkins 在前端项目中的典型流程

46. 单元测试、集成测试、E2E 测试区别；Vitest、Jest、Cypress、Playwright

47. 小程序开发：双线程模型、setData 性能、与 H5 的区别（了解）

48. 跨端方案：Taro、uni-app、React Native、Flutter 对比（了解）

49. WebAssembly 在前端的应用场景（了解）

50. PWA：Service Worker、manifest、离线缓存、推送通知

51. 前端监控：错误上报、性能指标、用户行为埋点、Source Map 反解

52. 简历项目描述与 STAR 法则；如何讲解技术难点

53. 手写题常考清单汇总：防抖节流、深拷贝、柯里化、并发控制、LRU、发布订阅

54. 数据结构常考：栈、队列、链表、树、二叉树遍历、图 BFS/DFS（笔试）

55. 算法常考：排序、二分、双指针、滑动窗口、动态规划入门题

56. 设计题：短链服务、秒杀前端、无限滚动、大文件上传、权限系统前端方案

57. TypeScript 在大型项目中的落地：类型覆盖率、any 治理、strict 渐进开启

58. 技术选型文档应包含哪些维度：团队熟悉度、生态、性能、维护成本

59. 前端安全清单：XSS、CSRF、点击劫持、依赖漏洞 npm audit、CSP

60. 浏览器存储选型决策树：Cookie / sessionStorage / localStorage / IndexedDB

61. SEO 与 SPA：预渲染、SSR、动态渲染（了解）

62. 低代码平台前端架构关注点： schema 驱动、物料、渲染引擎（了解）

63. 敏捷与前端协作：需求评审、估时、联调、提测 checklist

64. 职业规划与项目亮点提炼（软技能面试）
`,F=`---
title: "前端项目证据与面试串联归档"
date: "2026-08-28"
slug: "interview-project-chain"
category: "职业资产"
tags: ["项目证据", "Vue", "React", "面试"]
summary: "把通用面试知识连接到真实项目、业务场景和技术取舍，作为 AI 匹配 JD 与个人证据时的职业资产。"
cover: "/img/logo.jpg"
legacyPaths: []
---

> 归档说明：这份资料不再承担独立面试产品，而是作为“个人项目证据库”的历史底稿。使用时应先识别目标 JD 的核心问题，再从项目场景中选择证据。

[返回完整知识树](/blog/articles/interview-knowledge-archive) · [了解职业决策产品的新方向](/blog/articles/career-decision-system)

# 前端八股 · 项目串联背诵版（高级前端 / 技术负责人）

> **副本说明**：本文档由 \`前端八股文汇总背诵版.md\` 按「真实命中规律 + 项目→原理→八股」重组而成。  
> **不覆盖原稿**：原文件仍是完整知识树索引；本稿用于**怎么背、背什么、从哪条线串**。

---

## 使用说明

| 文档 | 用途 |
|------|------|
| \`前端八股文汇总背诵版.md\` | 全量题库检索、查漏补缺 |
| **本稿** | 按命中率优先级 + 业务场景串联背诵 |

**背诵原则**：先能讲清一条项目链路，再落到原稿对应章节抠细节。  
**面试原则**：高级岗少答「定义」，多答「我们项目里怎么做的 → 为什么 → 底层原理」。

**框架策略（Vue + React 双轨）**：

| 你的主栈 | 面试中的位置 |
|----------|----------------|
| **Vue**（金融 / 交易系统 / Agent） | 项目故事主战场，讲深讲透 |
| **React** | 高级岗**同等高频**；很多公司二面/交叉面必问；至少达到「能对比 + 能讲清 Hooks/Fiber/Redux 一条链」 |

> 下面每条业务链路都拆成：**通用原理 → Vue 落点 → React 落点**。背一条场景 = 两个框架都能接追问。

---

## 一、你的背景与命中规律

**背景标签**：金融系统 · **Vue + React** · 内部交易系统 · Agent 探索 · 高级前端 · 技术负责人方向  

**整体命中率（经验值，非绝对）**：

| 档位 | 占比 | 策略 |
|------|------|------|
| **高频** | ~80% | 必须能「项目故事 + 原理」闭环；**Vue、React 框架题都要能答** |
| **中频** | ~15% | 有余力补，面试前 1 周扫一遍 |
| **低频** | ~5% | 知道名词即可，**不必专门背** |

### 高频（80%）— 必串链路

| 领域 | 核心考点 |
|------|----------|
| **JS** | 事件循环、Promise、闭包、原型链、this、深浅拷贝、call/apply/bind、防抖节流 |
| **Vue** | 响应式、Diff、nextTick、生命周期、computed/watch、keep-alive、通信 |
| **React** | Hooks、Fiber/Diff、setState 批处理、useEffect、memo/useMemo/useCallback、Redux、lazy/Suspense、Error Boundary |
| **浏览器** | 输入 URL、缓存、回流重绘、渲染过程 |
| **网络** | HTTP、HTTPS、TCP、跨域 |
| **工程** | Webpack / Vite、性能优化 |
| **场景** | 首屏优化、权限、埋点、大列表 |
| **框架对比** | Vue vs React 设计差异、状态管理、更新机制（**中高级常问**） |

### 中频（15%）— 选背

HTML 语义 · CSS 进阶（IFC、幽灵节点、baseline）· Webpack 源码 · 浏览器多进程 · Next.js SSR 细节 · Zustand/Jotai 等

### 低频（5%）— 可跳过

DHTML、Flash、SGML、Cookie 隔离、clip、Waterfall 细抠等 — **很多公司根本不问**。

> 原稿索引见 [六、低频可跳过](#六低频5--附录可跳过索引)。

---

## 二、怎么背：项目 → 原理 → 八股

不要从「知识树顶层」往下背。  
要建立：**真实项目问题 → 你怎么做 → 追问落到哪条八股**。

### 万能答题结构（30 秒 + 2 分钟）

1. **场景**：什么业务、什么页面、什么指标  
2. **手段**：你/团队做了什么（可量化）  
3. **原理**：为什么有效（链路节点）  
4. **权衡**：代价、边界、重来会怎么改  
5. **（加分）框架对比**：「Vue 里用 nextTick，React 里对应 batching + useEffect queue」

### 主链路总览（覆盖 ~80% 面试）

| 链路 | 场景 | 框架相关节点 |
|------|------|----------------|
| **A** | Agent / 首屏慢 | nextTick ↔ batching；异步组件 ↔ lazy/Suspense |
| **B** | 交易大列表 | v-for/key ↔ list key/memo；虚拟列表两端通用 |
| **C** | 权限 / 安全 | 路由守卫 ↔ ProtectedRoute；XSS 两端通用 |
| **D** | 埋点 / 监控 | errorHandler ↔ Error Boundary |
| **E** | JS 手写 / 原理 | 与框架无关 |
| **F** | URL → 页面 | 与框架无关 |
| **G** | React 专项 | Fiber、Hooks、Redux（无 Vue 项目时也必问） |

---

### 链路 A：Agent / 首屏 — 「为什么慢？怎么优化？」

\`\`\`
【通用】Agent 对话页 / 多模块首屏慢、流式输出卡顿
    ↓ 指标
LCP、FCP、TTI、长任务 TBT（Performance API、Core Web Vitals）
    ↓ 构建
路由懒加载、dynamic import、splitChunks / manualChunks（Webpack、Vite）
    ↓ 缓存
强缓存 + 协商缓存、content-hash、CDN（Cache-Control、ETag、304）
    ↓ 运行时
Tree-shaking、按需加载、减首屏 bundle
    ↓ 框架更新层
    ├─ Vue：defineAsyncComponent / 路由 lazy；nextTick 后测 DOM；流式内容合并 patch
    └─ React：React.lazy + Suspense；startTransition / useDeferredValue 降优先级；
              useEffect 里请求；避免父组件 state 导致全树重渲染
    ↓ 虚拟 DOM
    ├─ Vue：Diff + 稳定 key；keep-alive 缓存子面板（若适用）
    └─ React：reconciliation + key；React.memo 包纯展示子树
    ↓ 异步
Promise / 微任务调度 UI 更新（事件循环）
    ↓ 交互
防抖（输入）、节流（滚动/resize）
\`\`\`

| | Vue 话术要点 | React 话术要点 |
|---|-------------|----------------|
| 加载 | 路由 lazy、异步组件、prefetch 降级 | \`React.lazy\`、\`Suspense\` fallback、路由 \`lazy()\` |
| 更新 | \`nextTick\` 合并测量/滚动 | 自动批处理（React 18）；\`flushSync\` 何时打破批处理 |
| 体验 | \`v-show\` vs 频繁切换 | \`useDeferredValue\` 延迟非紧急 UI |

**必背**：事件循环 · Promise · Diff · 缓存 · 分包 · **nextTick + React 批处理**  

**原稿**：\`# 前端性能优化\` · \`# webpack\` · \`# Vite\` · \`# Vue\` · \`# React\`（14、19、34、40）

---

### 链路 B：交易系统 / 大列表 — 「高频刷新怎么扛？」

\`\`\`
【通用】订单簿 / 行情表：千行级、秒级推送
    ↓ 现象
掉帧、内存涨、选中态丢、滚动跳动
    ↓ 方案
虚拟列表（react-window / vue-virtual-scroller 等）
    ↓ DOM
固定行高、transform、避免 layout thrashing（回流重绘）
    ↓ 框架
    ├─ Vue：稳定 key；子组件拆分；\`shallowRef\` / 冻结纯展示；computed 派生列；
    │        watch 精确来源，忌 deep 大对象
    └─ React：列表 key 不用 index；\`memo\` + 稳定 props；\`useMemo\` 派生数据；
              父组件少存可下放 state；推送节流 + \`useReducer\` 批量合并
    ↓ 通信
    ├─ Vue：props/emit、Pinia 按交易域拆 store
    └─ React：props/callback、Context（慎）、Redux/Zustand 分 slice
    ↓ 实时
WebSocket 消息进队列 → 节流渲染（100ms 一批）
\`\`\`

| | Vue | React |
|---|-----|-------|
| 列表 | \`v-for\` + \`:key="id"\` | \`map\` + \`key={id}\` |
| 少渲染 | \`computed\`、\`v-memo\`（Vue3） | \`React.memo\`、\`useMemo\` |
| 陷阱 | 深度 \`watch\` 行情对象 | 每次 render \`onClick={() => {}}\` 新引用 |

**原稿**：\`# Vue\` · \`# React\`（22-25、40-42）· \`# CSS\` · \`# 前端性能优化\`

---

### 链路 C：金融权限 / 安全

\`\`\`
【通用】菜单 / 按钮 / 接口三级权限 + 合规
    ↓ 前端
    ├─ Vue：vue-router beforeEach；动态 \`addRoute\`；\`v-if\` / 自定义指令
    └─ React：\`<ProtectedRoute>\`；路由配置里 role/meta；条件渲染 + 权限 Hook
    ↓ 状态
    ├─ Vue：Pinia 存 user/permissions
    └─ React：Redux/Zustand 或 Context（小项目）；JWT 解析角色
    ↓ 安全（通用）
HTTPS、HttpOnly Cookie、CSRF Token、XSS（dangerouslySetInnerHTML / v-html）
    ↓ 跨域
devServer.proxy / Vite proxy；生产 Nginx；CORS 预检
\`\`\`

**原稿**：\`# 其他\` 权限 · \`# Vue\` 路由守卫 · \`# React\` 32-33 · \`# HTTP\` · \`# 浏览器\`

---

### 链路 D：埋点 / 监控

\`\`\`
【通用】错误率、接口慢、白屏
    ↓ 采集
    ├─ Vue：\`app.config.errorHandler\`、全局 \`window.onerror\`
    └─ React：Error Boundary（渲染错误）；\`componentDidCatch\` / 类或 react-error-boundary
    ↓ 请求
axios/fetch 拦截器；\`unhandledrejection\`
    ↓ 上报
批量队列、采样、sendBeacon、微任务里 flush（不阻塞主线程）
    ↓ 性能
LCP/FCP、PerformanceObserver
\`\`\`

**原稿**：\`# 其他\` 51 · \`# React\` 35 · \`# JS\` · \`# 前端性能优化\`

---

### 链路 E：JS 基础（Vue / React 都会突然切题）

\`\`\`
事件循环 ↔ Promise/async ↔ 闭包 ↔ this/call/apply/bind
    ↔ 原型链 ↔ 深浅拷贝 ↔ 防抖节流
\`\`\`

**React 加考**：手写简易 \`useState\` / \`useEffect\`（链表 + 调度）；与事件循环的关系。  
**原稿**：\`# JS\` · \`# React\` 52 · \`# 在线笔试题\`

---

### 链路 F：浏览器 + 网络（框架无关）

\`\`\`
URL → DNS → TCP → TLS(HTTPS) → HTTP → 缓存(200/304)
    → 解析 → DOM/CSSOM → 渲染树 → Layout/Paint/Composite → 回流重绘
\`\`\`

**原稿**：\`# 浏览器\` · \`# HTTP\`

---

### 链路 G：React 专项（无 Vue 项目也会问满 15 分钟）

适合简历写 React、或面试官主攻 React 时**单独串一条**：

\`\`\`
JSX / 单向数据流 / 虚拟 DOM 是什么、解决什么问题
    ↓
Fiber：可中断、双缓冲、优先级（时间切片）
    ↓
更新：setState → 调度 → reconcile（Diff）→ commit DOM
    ↓
Hooks：useState（链表）、useEffect（deps + 清理）、规则（顺序）
    ↓
性能：memo / useMemo / useCallback（何时别滥用）
    ↓
状态管理：Redux 单向数据流 / RTK；与 Vue Pinia 对比
    ↓
路由：React Router；ProtectedRoute
    ↓
代码分割：lazy + Suspense；Error Boundary
    ↓
18+：自动批处理、startTransition、Concurrent
\`\`\`

**必背节点**：Fiber（能讲清两层）· Hooks 规则 · Diff+key · useEffect 依赖 · Redux 流程 · 批处理  

**原稿**：\`# React\` 全文 · \`# 其他\` 12-18（Fiber、Hooks 提纲）

---

## 三、Vue ↔ React 对照（面试「区别」题直接背这张表）

| 维度 | Vue | React |
|------|-----|-------|
| 核心理念 | 渐进式、模板/ SFC、自动依赖收集 | 函数式 UI、JSX、显式 setState / Hooks |
| 响应式 | Vue2 \`defineProperty\` / Vue3 \`Proxy\` + effect | \`useState\` + 不可变更新；Proxy 无内置响应式 |
| 更新调度 | 异步队列 + \`nextTick\` | Scheduler + Fiber；React 18 自动批处理 |
| 组件缓存 | \`keep-alive\` | 无内置；靠 \`memo\` + 路由 outlet 自实现 |
| 派生状态 | \`computed\`（自动缓存） | \`useMemo\`（手动 deps） |
| 副作用 | \`watch\` / \`watchEffect\` | \`useEffect\` / \`useLayoutEffect\` |
| 通信 | props / emit / provide / Pinia | props / callback / Context / Redux-Zustand |
| 列表 Diff | 双端指针 + key | 单端 + key；Fiber 链表 |
| 路由权限 | \`beforeEach\` + 动态路由 | \`<ProtectedRoute>\` + loader（v6.4+） |
| 异步组件 | \`defineAsyncComponent\` | \`React.lazy\` + \`Suspense\` |
| 错误捕获 | \`errorHandler\` | Error Boundary（仅渲染树） |
| SSR | Nuxt | Next.js（hydration 常问） |
| 适用话术 | 「业务台、中后台、团队 Vue 栈」 | 「生态、招聘面、复杂交互 / 跨端」 |

**一句话总结**：Vue 偏「编译期 + 自动依赖」；React 偏「运行时 + 显式数据流 + Fiber 调度」。**底层都要会：虚拟 DOM、Diff、key、单向数据、性能优化。**

**原稿**：\`# Vue\` 9、66-68 · \`# React\` 1、53

---

## 四、高频知识点速查

### JavaScript（Vue / React 共用 · P0）

| 主题 | 要能讲清什么 | 原稿 |
|------|----------------|------|
| 事件循环 | 宏/微任务顺序；async 输出题 | \`# JS\` 5、112；\`# 在线笔试题\` 24-28 |
| Promise | 状态、链式、all/race、catch 后 then | \`# JS\` 7、73-79 |
| 闭包 | 防抖、Hooks 闭包陷阱（React） | \`# JS\` 3；\`# React\` 44 |
| 原型链 / this | 继承、bind/call/apply | \`# JS\` 3、11、13 |
| 深浅拷贝 | 循环引用 | \`# JS\` 15、98 |
| 防抖节流 | 搜索、表格滚动 | \`# JS\` 121 |

### Vue（P0 · 主栈讲项目）

| 主题 | 原稿 |
|------|------|
| 响应式 / Proxy | \`# Vue\` 4、110 |
| Diff / key | \`# Vue\` 2、92 |
| nextTick | \`# Vue\` 12、88 |
| 生命周期 | \`# Vue\` 7、81 |
| computed / watch | \`# Vue\` 5 |
| keep-alive | \`# Vue\` 8、93 |
| 通信 / Pinia | \`# Vue\` 11、114-115 |

### React（P0 · 与 Vue 同级，不可只背对比）

| 主题 | 要能讲清什么 | 原稿 |
|------|----------------|------|
| 设计思想 | 声明式、单向数据流、组合 | \`# React\` 1、53 |
| JSX | 编译、createElement | \`# React\` 2 |
| Hooks 规则 | 顺序、为何不能 if 里调用 | \`# React\` 5 |
| useState / 批处理 | 函数式更新；React 18 batching | \`# React\` 6、19 |
| useEffect | 依赖、清理、与生命周期对应 | \`# React\` 7、43 |
| useLayoutEffect | 与 useEffect 区别 | \`# React\` 8 |
| useMemo / useCallback / memo | 何时用、何时滥用 | \`# React\` 10、25、40 |
| Fiber / Diff | 可中断、key、reconciliation | \`# React\` 20-23 |
| 合成事件 | 委托、与原生区别 | \`# React\` 17 |
| Redux / RTK | 流程、中间件、与 Pinia 对比 | \`# React\` 28-30 |
| Router / 权限 | ProtectedRoute | \`# React\` 32-33 |
| lazy / Suspense | 首屏分包 | \`# React\` 34 |
| Error Boundary | 能抓什么、不能抓什么 | \`# React\` 35 |
| React 18 | startTransition、useDeferredValue | \`# React\` 14 |
| 手写 | 简易 useState、useEffect | \`# React\` 52 |
| 性能 | 虚拟列表、render 里少建对象 | \`# React\` 40-42 |
| SSR / Next | hydration（做过再深讲） | \`# React\` 46-47 |

### 浏览器 & 网络（P0）

| 主题 | 原稿 |
|------|------|
| 输入 URL | \`# 浏览器\` 2 · \`# HTTP\` 18 |
| 缓存 | \`# 浏览器\` 10 · \`# HTTP\` |
| 回流重绘 | \`# CSS\` 30-31 · \`# 浏览器\` 2 |
| HTTP / HTTPS / TCP | \`# HTTP\` · \`# 浏览器\` 6-8 |
| 跨域 | \`# 浏览器\` 12 |

### 工程 & 场景（P0）

| 主题 | 原稿 |
|------|------|
| Webpack / Vite | \`# webpack\` · \`# Vite\` |
| 首屏 / 大列表 / 权限 / 埋点 | 链路 A–D · \`# 前端性能优化\` · \`# 其他\` |

---

## 五、场景题模板（Vue + React 双版本）

### 1. 首屏优化

**通用**：FCP/LCP/TTI · 分包 · 缓存 hash · CDN · 骨架屏 · 减 JS  

| Vue | React |
|-----|-------|
| 路由/组件 lazy | \`React.lazy\` + \`Suspense\` |
| \`nextTick\` 后测速 | 避免同步 setState 风暴；\`startTransition\` 降优先级 |
| Pinia 按需注册 | 路由级 code splitting；Redux 勿整包进 entry |

→ 链路 **A**

### 2. 大列表

**通用**：虚拟滚动 · 固定行高 · 节流推送 · Worker（可选）  

| Vue | React |
|-----|-------|
| \`key\`、子组件、\`computed\` | \`memo\`、\`useMemo\`、稳定 callback（\`useCallback\`） |
| \`v-memo\` | \`react-window\` |

→ 链路 **B**

### 3. 权限

**通用**：RBAC · 前后端一致 · Token · XSS/越权  

| Vue | React |
|-----|-------|
| \`beforeEach\`、\`addRoute\` | \`ProtectedRoute\`、权限 Hook |
| \`v-permission\` 指令 | 高阶组件 / 组件内 \`useAuth()\` |

→ 链路 **C**

### 4. 埋点

| Vue | React |
|-----|-------|
| \`errorHandler\` | Error Boundary + 全局 onerror |

→ 链路 **D**

### 5. 「Vue 和 React 你更熟？区别？」（必准备 2 分钟）

按 [三、对照表](#三vue--react-对照面试区别题直接背这张表) 答 + 各举**一个你项目里的真实选择原因**（不要只背八股）。

### 6. 技术负责人加答

方案评审、规范、技术债、带人 — 与框架无关，任何栈都要准备。

---

## 六、低频（5%）— 附录：可跳过索引

| 原稿关键词 | 说明 |
|------------|------|
| DHTML、Flash、SGML | 历史题 |
| Waterfall 细抠、Cookie 隔离、clip | 问得少 |
| 只考 Vue 的公司 | React 仍建议会对比 + Hooks 链，防换面试官 |

---

## 七、与原知识树对照

| 原文章节 | 优先级 | 背诵方式 |
|----------|--------|----------|
| \`# JS\` | **P0** | 链路 E + 笔试题 |
| \`# Vue\` | **P0** | 链路 A–D + 对照表 |
| \`# React\` | **P0** | 链路 A–D + **链路 G** + 对照表 |
| \`# 浏览器\` / \`# HTTP\` | **P0** | 链路 F |
| \`# webpack\` / \`# Vite\` | **P0** | 链路 A |
| \`# 前端性能优化\` | **P0** | 链路 A、B |
| \`# 其他\` | **P0/P1** | 权限、埋点、Fiber 提纲 |
| \`# TypeScript\` | **P1** | Vue + React 项目各 1 个例子 |
| \`# ES6\` | **P1** | 并入 JS |
| \`# CSS\` / \`# HTML\` | **P1/P2** | 回流重绘、script 加载 |
| \`# Node.js\` | **P2** | 全栈岗 |

---

## 八、复习节奏（4 周 · Vue + React 交替）

| 周次 | 目标 |
|------|------|
| **第 1 周** | 链路 E（JS）+ 笔试输出题；手写 Promise、防抖、**简易 useState** |
| **第 2 周** | 链路 F；**对照表背熟**；Vue 速查 + **React 链路 G**（Fiber/Hooks/Redux） |
| **第 3 周** | 链路 A、B：同一故事 **各讲一遍 Vue 版 + React 版**（各 3 分钟） |
| **第 4 周** | 链路 C、D + Webpack；模拟题：「从 Agent 首屏问到事件循环」+ 「从列表问到 Fiber」 |

**每日 30 min**：1 条链路口述 + **1 道 Vue 或 React 追问题**（隔天交替）+ 原稿补 1 个薄弱点。

---

## 九、自测清单（上场前勾选）

**通用**

- [ ] 链路 A/B/C 各 3 分钟（**每个场景能说 Vue 和 React 两种落点**）
- [ ] 事件循环 + Promise 输出题稳定
- [ ] URL → 渲染 → 缓存能画简图
- [ ] Webpack 优化结合真实项目讲 3 条

**Vue**

- [ ] 响应式、nextTick、Diff、生命周期、Pinia 各 1 分钟

**React**

- [ ] Hooks 规则 + useEffect 依赖陷阱能举例
- [ ] Fiber + Diff + key 能讲清「为什么列表不用 index」
- [ ] setState 批处理（React 18）+ \`memo\`/\`useMemo\` 区别
- [ ] Redux 数据流能画箭头图；与 Pinia 对比 3 句
- [ ] Error Boundary vs \`window.onerror\` 分工
- [ ] 手写简易 useState 或能说清链表结构

**对比题**

- [ ] 「Vue 和 React 区别」2 分钟不卡壳（对照表）

**负责人**

- [ ] 2 个失败案例 + 复盘

---

## 十、跳转全量题库

同目录：**\`前端八股文汇总背诵版.md\`**

- Vue 专题 → \`# Vue\`
- React 专题 → \`# React\`（53 条）
- 笔试 → \`# 在线笔试题\`

---

*文档版本：项目串联高级版 v2 · Vue + React 双轨 · 与全量知识树副本配套使用*
`,H=Object.assign({"../articles/2018/autoDriveForMIT01.md":R,"../articles/2018/autoDriveForMIT02.md":w,"../articles/2018/autoDriveForMIT03.md":M,"../articles/2018/underwaterRobots01.md":V,"../articles/2019/autoDriveForMIT04.md":C,"../articles/2019/underwaterRobots02.md":D,"../articles/2026/career-decision-system.md":E,"../articles/2026/career-tools-evolution.md":I,"../articles/2026/crypto-tools-evolution.md":x,"../articles/2026/fund-tools-evolution.md":A,"../articles/2026/information-tools-evolution.md":_,"../articles/2026/interview-knowledge-archive.md":J,"../articles/2026/interview-project-chain.md":F}),L=Object.assign({"../articles/2018/autoDriveForMIT01.md":()=>o(()=>import("./autoDriveForMIT01-WkDr8l4-.js"),__vite__mapDeps([0,1])),"../articles/2018/autoDriveForMIT02.md":()=>o(()=>import("./autoDriveForMIT02-CuSYrhPg.js"),__vite__mapDeps([2,1])),"../articles/2018/autoDriveForMIT03.md":()=>o(()=>import("./autoDriveForMIT03-BH9MmQI8.js"),__vite__mapDeps([3,1])),"../articles/2018/underwaterRobots01.md":()=>o(()=>import("./underwaterRobots01-CSIhBrsE.js"),__vite__mapDeps([4,1])),"../articles/2019/autoDriveForMIT04.md":()=>o(()=>import("./autoDriveForMIT04-Cyz7XZsc.js"),__vite__mapDeps([5,1])),"../articles/2019/underwaterRobots02.md":()=>o(()=>import("./underwaterRobots02-BeRQ-mQ-.js"),__vite__mapDeps([6,1])),"../articles/2026/career-decision-system.md":()=>o(()=>import("./career-decision-system-Cp4UXE1f.js"),__vite__mapDeps([7,1])),"../articles/2026/career-tools-evolution.md":()=>o(()=>import("./career-tools-evolution-CgMi92nF.js"),__vite__mapDeps([8,1])),"../articles/2026/crypto-tools-evolution.md":()=>o(()=>import("./crypto-tools-evolution-DqLrRmgr.js"),__vite__mapDeps([9,1])),"../articles/2026/fund-tools-evolution.md":()=>o(()=>import("./fund-tools-evolution-DdbQnKP3.js"),__vite__mapDeps([10,1])),"../articles/2026/information-tools-evolution.md":()=>o(()=>import("./information-tools-evolution-ir2dy4jS.js"),__vite__mapDeps([11,1])),"../articles/2026/interview-knowledge-archive.md":()=>o(()=>import("./interview-knowledge-archive-C8iRLcl3.js"),__vite__mapDeps([12,1])),"../articles/2026/interview-project-chain.md":()=>o(()=>import("./interview-project-chain-CqXUVwum.js"),__vite__mapDeps([13,1]))});function j(n){const e=n.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);if(!e)throw new Error("博客文章缺少 frontmatter");const t={};let a;for(const i of e[1].split(/\r?\n/)){const c=i.match(/^\s+-\s+["']?(.*?)["']?\s*$/);if(c&&a){a.push(c[1]);continue}const l=i.match(/^([\w-]+):\s*(.*)$/);if(!l)continue;const[,s,r]=l;if(!r.trim()){a=[],t[s]=a;continue}a=void 0,r.startsWith("[")?t[s]=r.slice(1,-1).split(",").map(b=>b.trim().replace(/^['"]|['"]$/g,"")):t[s]=r.trim().replace(/^['"]|['"]$/g,"")}const f=["title","date","slug","category","summary","cover"];for(const i of f)if(typeof t[i]!="string"||!t[i])throw new Error(`博客文章元数据缺少 ${i}`);return{metadata:{title:t.title,date:t.date,slug:t.slug,category:t.category,tags:t.tags||[],summary:t.summary,cover:t.cover,legacyPaths:t.legacyPaths||[]},content:e[2]}}const g=Object.entries(H).map(([n,e])=>{const{metadata:t,content:a}=j(e);return m(d({},t),{sourcePath:n,content:a,component:L[n]})}),S=new Set;for(const n of g){if(S.has(n.slug))throw new Error(`博客文章 slug 重复: ${n.slug}`);S.add(n.slug)}const v=g.sort((n,e)=>e.date.localeCompare(n.date)||n.slug.localeCompare(e.slug)),O=new Map(v.map(n=>[n.slug,n])),G=new Map(v.flatMap(n=>n.legacyPaths.map(e=>[N(e),n])));function N(n){let e=decodeURIComponent(n).replace(/\\/g,"/");return e=e.replace(/\/index\.html?$/,"").replace(/\.html?$/,"").replace(/\/$/,""),e||"/"}function U(n){return O.get(n)}export{v as a,G as b,U as g,N as n};
