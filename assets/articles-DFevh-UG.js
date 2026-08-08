const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/autoDriveForMIT01-Btd0j_2j.js","assets/vue-vendor-D1W2UyFa.js","assets/autoDriveForMIT02-B3sK8f1t.js","assets/autoDriveForMIT03-D5D6Osb1.js","assets/underwaterRobots01-DMXfQOka.js","assets/autoDriveForMIT04-BYKRt2qL.js","assets/underwaterRobots02-Yp4YCS2r.js"])))=>i.map(i=>d[i]);
var T=Object.defineProperty,_=Object.defineProperties;var M=Object.getOwnPropertyDescriptors;var l=Object.getOwnPropertySymbols;var b=Object.prototype.hasOwnProperty,y=Object.prototype.propertyIsEnumerable;var m=(n,t,e)=>t in n?T(n,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):n[t]=e,c=(n,t)=>{for(var e in t||(t={}))b.call(t,e)&&m(n,e,t[e]);if(l)for(var e of l(t))y.call(t,e)&&m(n,e,t[e]);return n},d=(n,t)=>_(n,M(t));import{a as r}from"./index-D_4hGw59.js";const D=`---
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
`,P=`---
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
`,F=`---
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
`,f=`---
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
`,A=`---
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
`,R=`---
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
`,S=Object.assign({"../articles/2018/autoDriveForMIT01.md":D,"../articles/2018/autoDriveForMIT02.md":P,"../articles/2018/autoDriveForMIT03.md":F,"../articles/2018/underwaterRobots01.md":f,"../articles/2019/autoDriveForMIT04.md":A,"../articles/2019/underwaterRobots02.md":R}),k=Object.assign({"../articles/2018/autoDriveForMIT01.md":()=>r(()=>import("./autoDriveForMIT01-Btd0j_2j.js"),__vite__mapDeps([0,1])),"../articles/2018/autoDriveForMIT02.md":()=>r(()=>import("./autoDriveForMIT02-B3sK8f1t.js"),__vite__mapDeps([2,1])),"../articles/2018/autoDriveForMIT03.md":()=>r(()=>import("./autoDriveForMIT03-D5D6Osb1.js"),__vite__mapDeps([3,1])),"../articles/2018/underwaterRobots01.md":()=>r(()=>import("./underwaterRobots01-DMXfQOka.js"),__vite__mapDeps([4,1])),"../articles/2019/autoDriveForMIT04.md":()=>r(()=>import("./autoDriveForMIT04-BYKRt2qL.js"),__vite__mapDeps([5,1])),"../articles/2019/underwaterRobots02.md":()=>r(()=>import("./underwaterRobots02-Yp4YCS2r.js"),__vite__mapDeps([6,1]))});function E(n){const t=n.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);if(!t)throw new Error("博客文章缺少 frontmatter");const e={};let o;for(const a of t[1].split(/\r?\n/)){const g=a.match(/^\s+-\s+["']?(.*?)["']?\s*$/);if(g&&o){o.push(g[1]);continue}const u=a.match(/^([\w-]+):\s*(.*)$/);if(!u)continue;const[,s,i]=u;if(!i.trim()){o=[],e[s]=o;continue}o=void 0,i.startsWith("[")?e[s]=i.slice(1,-1).split(",").map(h=>h.trim().replace(/^['"]|['"]$/g,"")):e[s]=i.trim().replace(/^['"]|['"]$/g,"")}const v=["title","date","slug","category","summary","cover"];for(const a of v)if(typeof e[a]!="string"||!e[a])throw new Error(`博客文章元数据缺少 ${a}`);return{metadata:{title:e.title,date:e.date,slug:e.slug,category:e.category,tags:e.tags||[],summary:e.summary,cover:e.cover,legacyPaths:e.legacyPaths||[]},content:t[2]}}const I=Object.entries(S).map(([n,t])=>{const{metadata:e,content:o}=E(t);return d(c({},e),{sourcePath:n,content:o,component:k[n]})}),p=new Set;for(const n of I){if(p.has(n.slug))throw new Error(`博客文章 slug 重复: ${n.slug}`);p.add(n.slug)}const w=I.sort((n,t)=>t.date.localeCompare(n.date)||n.slug.localeCompare(t.slug)),L=new Map(w.map(n=>[n.slug,n])),B=new Map(w.flatMap(n=>n.legacyPaths.map(t=>[G(t),n])));function G(n){let t=decodeURIComponent(n).replace(/\\/g,"/");return t=t.replace(/\/index\.html?$/,"").replace(/\.html?$/,"").replace(/\/$/,""),t||"/"}function q(n){return L.get(n)}export{w as a,B as b,q as g,G as n};
