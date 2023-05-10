<template><div><h1 id="水下机器人的运动分析与建模" tabindex="-1"><a class="header-anchor" href="#水下机器人的运动分析与建模" aria-hidden="true">#</a> 水下机器人的运动分析与建模</h1>
<div style='color:red'>2018-12-09 </div>
<p>先放出框架图</p>
<p><img src="/image/underwaterRobots01/1683700534763.png" alt="1683700534763"></p>
<p>对于水下机器人，一定要建立一个静止的坐标系（定系）和运动的坐标系（动系），这个是分析水下机器人的运动基础。</p>
<p>定系：越简单越好，一般建议起始点为静系，且水平面+重力坐标系为宜。</p>
<p>动系：水下机器人自身的坐标系，这个一般都是输入控制量给定的，而且对于某个时刻的水下机器人，相对定系的空间状态量是已知的，否则只能重新初始化为水平面+重力坐标系。</p>
<p>总结一下：</p>
<p><img src="/image/underwaterRobots01/1683700540642.png" alt="1683700540642"></p>
<h2 id="_1、运动的分解和合成" tabindex="-1"><a class="header-anchor" href="#_1、运动的分解和合成" aria-hidden="true">#</a> 1、运动的分解和合成</h2>
<p>观察选择以速度作为表述，输入选择以角速度作为表述。</p>
<h2 id="_2、力的分解和合成" tabindex="-1"><a class="header-anchor" href="#_2、力的分解和合成" aria-hidden="true">#</a> 2、力的分解和合成</h2>
<p>涉及到流体的力学分析很麻烦，所以在只能选择低速状态下，这样就可以考虑流体力学的一阶泰勒展开式，对于高阶的受力可以忽略不计。</p>
<h2 id="_3、力矩问题" tabindex="-1"><a class="header-anchor" href="#_3、力矩问题" aria-hidden="true">#</a> 3、力矩问题</h2>
<p>在输入设定的时候，通过设定的扭矩来达到相应运动变化，即受力平衡状况调节</p>
</div></template>


