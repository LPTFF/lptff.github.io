# 无人驾驶麻省理工01讲

<div style='color:red'>2018-12-09 </div>

PDF链接: [麻省理工自动驾驶 MIT 6.S094第一讲](https://whuteducn-my.sharepoint.com/:b:/g/personal/220077_whut_edu_cn/EUUMsVDo9yJAg9bWfz40jQsBuXFY13DTisylqQDg1nwyUQ?e=EGdbDD)

bilibili: [麻省理工自动驾驶 MIT 6.S094第一讲](https://www.bilibili.com/video/av23594594)

**写在前言：最近在学习麻省理工自动驾驶课程，本人在学习视频的同时写了一点学习笔记，有需要的童鞋可以参考一下。**

## （1）P15对于同一个问题的简单表达，如P16对于笛卡尔坐标系的分类，可以通过坐标变换在极坐标系中表达

我觉得这一页写的非常好，在具体分析问题时，我们都是尽可能的把复杂问题简单化，视频中老师演示了日心说和地心说的例子，同时也展示了笛卡尔坐标系的平面变换。

![1683701632578](/image/autoDriveForMIT01/1683701632578.png)

[日心说和地心说](http://www.365yg.com/i6632871765829747203/#mid=1619346472494083)
![1683701655925](/image/autoDriveForMIT01/1683701655925.png)

笛卡尔坐标系的平面变换

## （2）P22卷积计算的表达

在实际神经网络中，我们面临的往往是一个“黑匣子”，即当下流行的各种训练框架，如TensorFlow、Pytorch、Keras等，都是基于封装好的接口。因此我每次和别人讲解卷积计算感觉特费劲，这个是我见过目前最好的例子了。

![1683701669617](/image/autoDriveForMIT01/1683701669617.png)

[3D视频演示](http://www.365yg.com/i6632863431642841613/#mid=1619346472494083)

## （3）P24神经网络的演示

这个可以作为童鞋们写PPT的一大利器啊，我是不会网页的动画扣取。

![1683701687226](/image/autoDriveForMIT01/1683701687226.png)

[神经网络激活](https://appliedgo.net/perceptron/)

## （4）P30深度增强学习的演示

其实增强学习当下已经研究的非常火热，这个实例其实也一般。

![1683701714092](/image/autoDriveForMIT01/1683701714092.png)![1683701701061](/image/autoDriveForMIT01/1683701701061.png)

[增强学习](http://www.365yg.com/i6632863436051055118/#mid=1619346472494083)

## （5）P38、P39、P40梯度典型问题

如上所说，目前流行的深度学习框架只提供了很少的训练评估参数，但是对于研究神经网络具体的训练问题时，如梯度消失或者梯度死亡等常见的现象，我们只能是尽可能的调取其中可提供的参数进行观察，这几页很好的解决了我对梯度问题难以理解的痛点。

![1683701726199](/image/autoDriveForMIT01/1683701726199.png)

[梯度问题01](http://www.365yg.com/i6632871778764997134/#mid=1619346472494083)
[梯度问题02](http://www.365yg.com/i6632871782967689735/#mid=1619346472494083)
![1683701750839](/image/autoDriveForMIT01/1683701750839.png)

## （6）P44正则化防止过拟合的一种方法dropout

这个方法我目前还没有接触，可能是我撸的代码不够多吧，先Mark一下。

![1683701760271](/image/autoDriveForMIT01/1683701760271.png)

[正则化dropout](http://www.365yg.com/i6632871774423876109/#mid=1619346472494083)

## （7）P46网站推荐

很有趣的一个网站，可以帮助大家直观理解神经网络的操作流程。

![1683701782236](/image/autoDriveForMIT01/1683701782236.png)

[神经网络的演示](http://playground.tensorflow.org/#activation=tanh&batchSize=10&dataset=circle&regDataset=reg-plane&learningRate=0.03&regularizationRate=0&noise=0&networkShape=4,2&seed=0.23279&showTestData=false&discretize=false&percTrainData=50&x=true&y=true&xTimesY=false&xSquared=false&ySquared=false&cosX=false&sinX=false&cosY=false&sinY=false&collectStats=false&problem=classification&initZero=false&hideText=false)

## （8）P57图片分割分类

这个感觉有点像U-net网络啊，不过又有点区别，这个侧重于提取更多的特征，很不错的思路。

![1683701821091](/image/autoDriveForMIT01/1683701821091.png)

[图片分类](https://adeshpande3.github.io/adeshpande3.github.io/A-Beginner's-Guide-To-Understanding-Convolutional-Neural-Networks/)

## （9）P61背景移除

没试过这个操作，先放出链接吧。

![1683701833113](/image/autoDriveForMIT01/1683701833113.png)

[背景移除](https://towardsdatascience.com/background-removal-with-deep-learning-c4f2104b3157)

## （10）P71AlphaGo Zero

大名鼎鼎的AlphaGo 啊，不过这个应该是变种版，增强学习现在都脱离经验的学习了，厉害。

![1683701846190](/image/autoDriveForMIT01/1683701846190.png)

[AlphaGo Zero](http://www.365yg.com/i6632871770376372743/#mid=1619346472494083)

## （11）P73奖励游戏

坦白的说，这个游戏没看懂，不知道讲课老师怎么会迷恋上这种游戏。

![1683701855686](/image/autoDriveForMIT01/1683701855686.png)

[奖励游戏](http://www.365yg.com/i6632863427394011652/#mid=1619346472494083)

# 写在最后

可能本文有很多童鞋会访问不了其中的一些网页，那么我就放出福利吧
[GitHub福利链接](https://github.com/Alvin9999/new-pac/wiki/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7)
[免费ssr账号](https://doub.io/sszhfx/)
