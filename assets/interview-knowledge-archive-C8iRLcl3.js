import{a as p,g as e,_ as o}from"./vue-vendor-c7x-_rhk.js";const t={class:"markdown-body"},s="前端面试知识树归档",u="2026-08-28",d="interview-knowledge-archive",S="职业资产",m=["前端","面试","知识归档"],v="从独立面试题页面迁入博客的完整前端知识树，用于检索和 AI 按岗位调用，不再作为一级求职产品。",g="/img/logo.jpg",f=["/interview"],h={__name:"interview-knowledge-archive",setup(n,{expose:l}){return l({frontmatter:{title:"前端面试知识树归档",date:"2026-08-28",slug:"interview-knowledge-archive",category:"职业资产",tags:["前端","面试","知识归档"],summary:"从独立面试题页面迁入博客的完整前端知识树，用于检索和 AI 按岗位调用，不再作为一级求职产品。",cover:"/img/logo.jpg",legacyPaths:["/interview"]}}),(r,i)=>(p(),e("div",t,[...i[0]||(i[0]=[o(`<blockquote><p>归档说明：这份资料原来由独立“面试题”页面展示。现在它作为个人职业知识资产保留在博客中；实际求职准备应从具体 JD 出发，由 AI 选择最值得准备的部分，而不是从头浏览全部题目。</p></blockquote><p><a href="/blog/articles/interview-project-chain">查看按项目场景串联的面试准备稿</a> · <a href="/blog/articles/career-decision-system">了解职业决策产品的新方向</a></p><h1>HTML</h1><ol><li><p>HTML5新增特性； HTML5 为什么只需要写 <code>&lt;!DOCTYPE HTML &gt;</code>，而不需要引入 DTD ；HTML5 元素的分类； HTML5 有哪些新特性、移除了那些元素；如何处理 HTML5 新标签的浏览器兼容问题； HTML5 的 form 的自动完成功能是什么；HTML5 的离线储存怎么使用,工作原理能不能解释一下；HTML5 新增的表单元素有哪些；在 HTML5 中,哪个方法用于获得用户的当前位置；用于预格式化文本的标签是什么</p></li><li><p><code>&lt;link&gt;</code>标签定义；<code>&lt;title&gt;</code>与 <code>&lt;h1&gt;</code>的区别；<code>&lt;img&gt;</code>的 title 和 alt 有什么区别；常用的 meta 标签；<code>&lt;head &gt;</code>标签中必不少的是哪些；<code>&lt;b&gt; </code>与 <code>&lt;strong&gt;</code> 的区别和 <code>&lt;i&gt; </code>与 <code>&lt;em&gt;</code> 的区别；<code>&lt;label&gt; </code>的作用是什么?是怎么用的；src和href的区别</p></li><li><p>标准模式与兼容模式各有什么区别；实现不使用 border 画出 1 px 高的线,在不同浏览器的标准模式与怪异模式下都能保持一致的效果</p></li><li><p>行内元素、块级元素、空（void）；行内元素定义；块级元素定义；行内元素与块级元素的区别； 空元素定义</p></li><li><p>DOCTYPE(⽂档类型) 的作⽤；DOCTYPE 的作用是什么；DTD 介绍；DHTML 是什么；文档的不同注释方式</p></li><li><p>简述一下你对 HTML 语义化的理解；HTML语义化标签有哪些；SGML 、 HTML 、XML 和 XHTML 的区别；</p></li><li><p>对 web 标准、可用性、可访问性的理解；Html 规范中为什么要求引用资源不加协议头http或者https</p></li><li><p>BOM 和 DOM 的区别；解释一下DOM操作(增删改查)及其不同点 ；怎样添加、移除、移动、复制、创建和查找节点；attribute 和 property 的区别是什么；DOMContentLoaded 事件和 Load 事件的区别</p></li><li><p>script标签中defer和async的区别；async 和 defer 的作用是什么?有什么区别?(浏览器解析过程)</p></li><li><p>页面可见性(Page Visibility API) 可以有哪些用途；如何在页面上实现一个圆形的可点击区域</p></li><li><p>页面导入样式时,使用 <code>&lt;link&gt;</code>和 <code>@import</code>有什么区别； <code>&lt;link&gt;</code>和 <code>@import</code>的区别</p></li><li><p>IE 各版本和 Chrome 可以并行下载多少个资源；介绍一下Chrome 中的 Waterfall</p></li><li><p>扫描二维码登录网页是什么原理，前后两个事件是如何联系的</p></li><li><p>Flash、Ajax 各自的优缺点，在使用中如何取舍</p></li><li><p>网页验证码是干嘛的，是为了解决什么安全问题</p></li><li><p>css reset 和 normalize.css 有什么区别</p></li><li><p>Canvas 和 SVG 有什么区别</p></li><li><p>disabled 和 readonly 的区别</p></li><li><p>渐进增强和优雅降级的定义</p></li><li><p>iframe 有哪些优点和缺点</p></li><li><p>怎么重构页面</p></li><li><p>picture、source 与响应式图片；img 的 loading、decoding、fetchpriority 属性</p></li><li><p>template、slot、dialog、details/summary 等 HTML5 语义与交互标签</p></li><li><p>preload、prefetch、preconnect、dns-prefetch 的区别与使用场景</p></li><li><p>Content-Security-Policy（CSP）是什么，如何通过 meta 或响应头配置</p></li><li><p>无障碍（a11y）：ARIA 属性、role、alt 与 label 的关联、键盘可访问性</p></li><li><p>SEO 相关：title、meta description、canonical、结构化数据（JSON-LD）、语义化标签对爬虫的影响</p></li><li><p>表单相关：novalidate、formaction、formenctype、input 的 type 新增类型（email、url、number、range、color、date 等）</p></li><li><p>拖拽 API（draggable、dropzone、DataTransfer）；全屏 API；剪贴板 API</p></li><li><p>Web Components：Custom Elements、Shadow DOM、HTML Templates 基本概念</p></li><li><p>媒体查询在 HTML 中的 link media；打印样式 @media print</p></li><li><p>字符实体、HTML 实体编码；XSS 与 innerHTML 注入风险</p></li><li><p>什么是 Quirks Mode 与 Standards Mode；如何触发怪异模式</p></li><li><p>data-* 自定义属性的作用与使用场景</p></li><li><p>什么是 Content Editable；designMode 与 contentEditable 的区别</p></li></ol><h1>CSS</h1><ol><li><p>讲一下盒模型，普通盒模型和怪异盒模型有什么区别；介绍一下标准的 CSS 的盒子模型和低版本 IE 的盒子模型有什么不同的； 内联盒模型基本概念；如何去除 inline-block 元素间间距；li 与 li 之间有看不见的空白间隔是什么原因引起的，有什么解决办法</p></li><li><p>几种常见的 CSS 布局；讲一下flex弹性盒布局；flex:1 是哪些属性的缩写，对应的属性代表什么含义；flexbox 布局的属性和使用场景；flex布局理解</p></li><li><p>BFC、IFC是什么；BFC 块级格式化上下文；对BFC的理解，如何创建BFC；块元素和行内元素区别是什么，常见块元素和行内元素有哪些；什么是包含块，对于包含块的理解；对 BFC 规范(块级格式化上下文 block formatting context)的理解；IFC 是什么；元素竖向的百分比设定是相对于容器的高度吗</p></li><li><p>常见的水平垂直居中实现方案；CSS如何实现垂直居中，实现水平垂直居中，实现图片居中；如何居中 div；有一个高度自适应的 div，里面有两个 div，一个高度 100px，希望另一个填满剩下的高度；css 实现上下固定中间自适应布局；css 两栏布局的实现；css 三栏布局的实现</p></li><li><p>CSS常见的选择器有哪些；CSS选择器和优先级；CSS的优先级如何计算；CSS3新增特性；CSS可继承属性和不可继承属性；CSS 选择符有哪些；CSS 中哪些属性可以继承；CSS 优先级算法如何计算</p></li><li><p>常见的CSS单位；长度单位px、em和rem的区别是什么；画一条0.5px的线；如何解决1px；使用 rem 布局的优缺点；设备像素、css 像素、设备独立像素、dpr、ppi 之间的区别</p></li><li><p>浮动塌陷问题解决方法是什么；请解释一下为什么需要清除浮动以及清除浮动的方式；使用 clear 属性清除浮动的原理；zoom:1 的清除浮动原理；对于 hasLayout 的理解；layout viewport、visual viewport 和 ideal viewport 的区别；常用 hack 的技巧；</p></li><li><p>position 常用属性及其默认值是什么；position属性的值有哪些，各个值是什么含义；position 的值 relative 和 absolute 定位原点是什么； 绝对定位元素与非绝对定位元素的百分比计算的区别；display 、position 和 float的相互关系；absolute 的 containing block(包含块)计算方式跟正常流有什么不同</p></li><li><p>display的属性和作用；单行、多行文本溢出；隐藏元素的方法；隐藏元素的方式；display 有哪些值，说明他们的作用；解释一下CSS 里的 visibility 属性中 collapse ；隐藏元素的 background-image 到底加不加载；如何实现单行/多行文本溢出的省略(…)；常见的元素隐藏方式有哪些</p></li><li><p>什么是margin重叠，如何解决；margin 重叠问题的理解；content 与替换元素的关系；margin:auto 的填充规则；margin 无效的情形；border 的特殊性；什么是基线和 x-height；line-height 的特殊性；vertical-align 的特殊性；overflow 的特殊性；无依赖绝对定位是什么；absolute 与 overflow 的关系；relative 的特殊性；margin 和 padding 分别适合什么场景使用；width:auto 和 width:100%的区别；为什么 height:100% 会无效；min-width、max-width 和 min-height、max-height 属性间的覆盖规则</p></li><li><p>为什么要初始化 CSS 样式；使用 CSS 预处理器吗，介绍一下有哪些；CSS 优化、提高性能的方法有哪些；浏览器是怎样解析 CSS 选择器的；为什么不建议使用统配符初始化 css 样式；介绍一下Sass、Less 的区别是什么；什么是 CSS 预处理器/后处理器</p></li><li><p>全屏滚动的原理是什么，用到了 CSS 的哪些属性待深入实践)；视差滚动效果，如何给每页做不同的动画（回到顶部，向下滑动要再次出现，和只出现一次分别怎么做）；overflow:scroll 不能平滑滚动的问题怎么处理；offsetWidth/offsetHeight,clientWidth/clientHeight 与 scrollWidth/scrollHeight 的区别</p></li><li><p>经常遇到的浏览器的兼容性有哪些，解释一下原因及其解决方法；介绍一下移动端的布局媒体查询；什么是响应式设计，响应式设计的基本原理是什么，如何兼容低版本的 IE(待深入了解)；position:fixed在 android 下无效怎么处理</p></li><li><p>简单介绍使用图片 base64 编码的优点和缺点；png、jpg、gif 、webp这些图片格式解释一下，分别什么时候用；浏览器如何判断是否支持 webp 格式图片</p></li><li><p>实现一个三角形；用纯 CSS 创建一个三角形的原理是什么；实现一个宽高自适应的正方形；一个自适应矩形,水平垂直居中，且宽高比为 2:1；CSS 多列等高如何实现</p></li><li><p>::before 和:after 中双冒号和单冒号有什么区别，解释一下这两个伪元素的作用；伪类与伪元素的区别；关于伪类 LVHA 的解释；CSS3 新增伪类有那些；伪类和伪元素的区别是什么</p></li><li><p>如何修改 chrome 记住密码后自动填充表单的黄色背景；怎么让 Chrome 支持小于 12px 的文字；让页面里的字体变清晰，变细用 CSS 怎么做；font-style 属性中 italic 和 oblique 的区别；font-weight 的特殊性；text-indent 的特殊性； letter-spacing 与字符间距；word-spacing 与单词间距；white-space 与换行和空格的控制；一个满屏品字布局如何设计</p></li><li><p>CSS3 有哪些新特性(根据项目回答)；请解释一下 CSS3 的 Flex box(弹性盒布局模型)以及适用场景；简单说一下 css3 的 all 属性</p></li><li><p>在网页中应该使用奇数还是偶数的字体，解释一下</p></li><li><p>抽离样式模块怎么写</p></li><li><p>如果需要手动写动画，你认为最小时间间隔是多久，为什么； transition 和 animation 的区别</p></li><li><p>什么是 Cookie 隔离，请求资源的时候不要让它带 cookie 怎么做</p></li><li><p>style 标签写在 body 后与 body 前有什么区别</p></li><li><p>阐述一下 CSSSprites</p></li><li><p>什么是首选最小宽度</p></li><li><p>什么是幽灵空白节点</p></li><li><p>什么是替换元素；替换元素的计算规则</p></li><li><p>clip 裁剪是什么</p></li><li><p>什么是层叠上下文；什么是层叠水平；元素的层叠顺序；层叠准则</p></li><li><p>解释一下回流与重绘</p></li><li><p>你知道 CSS 中不同属性设置为百分比\\x 时对应的计算基准</p></li><li><p>回流和重绘</p></li><li><p>盒模型</p></li><li><p>有哪些CSS选择器</p></li><li><p>css优先级</p></li><li><p>css居中</p></li><li><p>元素margin合并</p></li><li><p>BFC、IFC</p></li><li><p>block、inline和inline-block的元素有什么差别</p></li><li><p>display：none与visibility:hidden区别</p></li><li><p>隐藏元素的方法</p></li><li><p>css画三角形</p></li><li><p>盒模型盒子的宽度计算</p></li><li><p>两种盒模型对比</p></li><li><p>有哪些CSS选择器</p></li><li><p>css优先级</p></li><li><p>css优先级计算</p></li><li><p>div .div #div div&gt;div&gt;div优先级</p></li><li><p>class、id、tag 的优先级</p></li><li><p>为什么不推荐用多层css选择器</p></li><li><p>css选择器处理</p></li><li><p>css居中</p></li><li><p>多列等高布局</p></li><li><p>元素margin合并</p></li><li><p>BFC、IFC</p></li><li><p>如何清除浮动</p></li><li><p>block、inline和inline-block的元素有什么差别</p></li><li><p>display属性</p></li><li><p>说说你对盒子模型的理解</p></li><li><p>css选择器有哪些？优先级？哪些属性可以继承</p></li><li><p>说说em/px/rem/vh/vw区别</p></li><li><p>说说设备像素、css像素、设备独立像素、dpr、ppi 之间的区别</p></li><li><p>css中，有哪些方式可以隐藏页面元素？区别</p></li><li><p>谈谈你对BFC的理解</p></li><li><p>元素水平垂直居中的方法有哪些？如果元素不定宽高呢</p></li><li><p>如何实现两栏布局，右侧自适应？三栏布局中间自适应呢</p></li><li><p>说说flexbox（弹性盒布局模型）,以及适用场景</p></li><li><p>介绍一下grid网格布局</p></li><li><p>CSS3新增了哪些新特性</p></li><li><p>css3动画有哪些</p></li><li><p>怎么理解回流跟重绘？什么场景下会触发</p></li><li><p>什么是响应式设计？响应式设计的基本原理是什么？如何做</p></li><li><p>如果要做优化，CSS提高性能的方法有哪些</p></li><li><p>如何实现单行／多行文本溢出的省略样式</p></li><li><p>如何使用css完成视差滚动效果</p></li><li><p>CSS如何画一个三角形？原理是什么</p></li><li><p>让Chrome支持小于12px 的文字方式有哪些？区别</p></li><li><p>说说对Css预编语言的理解？有哪些区别?</p></li><li><p>CSS 容器查询（container queries）与 @container；:has() 伪类及其应用场景</p></li><li><p>CSS 逻辑属性（margin-inline、padding-block 等）与书写模式</p></li><li><p>subgrid 是什么，解决什么问题</p></li><li><p>CSS 变量（自定义属性）的作用域与继承；与 Sass 变量的区别</p></li><li><p>will-change、contain、content-visibility 对渲染性能的影响</p></li><li><p>CSS 层（@layer）与 cascade layers 优先级规则</p></li><li><p>aspect-ratio、object-fit、object-position 的用法</p></li><li><p>filter、backdrop-filter、mix-blend-mode 的区别与性能注意点</p></li><li><p>CSS Grid 与 Flex 如何选择；grid-template-areas 布局</p></li><li><p>移动端 1px 边框、安全区域 env(safe-area-inset-*)、viewport-fit=cover</p></li><li><p>CSS-in-JS、CSS Modules、Tailwind 等方案对比（工程化选型）</p></li><li><p>@supports 特性检测与渐进增强</p></li></ol><h1>JS</h1><ol><li><p>js有哪些数据类型；数据类型判断方式有几种；解释一下es6新增symbol数据类型；typeof和instance of的区别；js有哪些判断类型的方法；JS 类型检测的方法 typeof、instanceOf 、Object.prototype.toString() 需要理解各个检查方法的输出；instanceof 运算符的实现原理及实现；typeof 和 instanceof 区别；NaN是什么，如何判断是否是NaN类型；null、undefined及未声明变量之间的区别，如何区分；null和undefined区别；map和Object的区别map和weakMap的区别；介绍 js 的基本数据类型；JavaScript 有几种类型的值?你能画一下他们的内存图吗；什么是堆?什么是栈?它们之间有什么区别和联系；undefined 与 undeclared 的区别；null 和 undefined 的区别；如何获取安全的 undefined 值；在 js 中不同进制数字的表示方式； js 中整数的安全范围是多少；typeof NaN 的结果是什么；isNaN 和 Number.isNaN 函数的区别；Array 构造函数只有一个参数值时的表现；其他值到字符串的转换规则；其他值到数字值的转换规则；其他值到布尔类型的值的转换规则；{} 和 [] 的 valueOf 和 toString 的结果是什么；substring和substr的区别；解析字符串中的数字和将字符串强制类型转换为数字的返回结果都是数字,它们之间的区别是什么；操作符什么时候用于字符串的拼接；什么情况下会发生布尔值的隐式强制类型转换；|| 和 操作符的返回值；Symbol 值的强制类型转换；== 操作符的强制类型转换规则；如何将字符串转化为数字,例如 ‘12.3’；如何将浮点数点左边的数每三位添加一个逗号,如 12000000.11 转化为『12,000,000.11』；如何判断一个对象是否属于某个类；instanceof 的作用;Symbol 类型的注意点; Object.is() 与原来的比较操作符 “===”、“==” 的区别;Set 和 WeakSet 结构；Map 和 WeakMap 结构；如何封装一个 javascript 的类型判断函数;如何判断一个对象是否为空对象</p></li><li><p>JS 模块化方案；CommonJS；CommonJS和ESM区别；AMD、CMD、UMD；ES6 module是编译时导出接口，CommonJS是运行时导出对象。ES6 module输出的值的引用，CommonJS输出的是一个值的拷贝。ES6 module语法是静态的，CommonJS语法是动态的。ES6 module导入模块的是只读的引用，CommonJS导入的是可变的，是一个普通的变量。ES6 module支持异步，CommonJS不支持异步；模块化开发怎么做； js 的几种模块规范；AMD 和 CMD 规范的区别；ES6 模块与 CommonJS 模块、AMD、CMD 的差异；requireJS 的核心原理是什么?(如何动态加载的?如何避免多次加载的?如何缓存的?)；JS 模块加载器的轮子怎么造,也就是如何实现一个模块加载器；require 模块引入的查找方式</p></li><li><p>谈谈对原型链的理解；js如何实现继承（原型和原型链）；JS原型，原型链；实现继承的方式；实现寄生组合继承；JavaScript 原型,原型链? 有什么特点；js 获取原型的方法；Javascript 的作用域链；谈谈对闭包的理解，什么是闭包；闭包有哪些应用场景；闭包有什么缺点；如何避免闭包；闭包和作用域谈一下区别；JS作用域及作用域链/闭包（closure），常用场景举例说明；闭包和原型链谈一下区别；对作用域、作用域链的理解；对闭包的理解以及它的使用场景； JavaScript 继承的几种实现方式；寄生式组合继承的实现;什么是闭包,为什么要用它;使用闭包实现每隔一秒打印 1,2,3,4</p></li><li><p>如何判断一个变量是否数组；判断数组的方式有哪些；如何实现数组拍平；如何实现数组去重；数组的遍历方法；数组的for Each和map方法有哪些区别；常用哪些方法去对数组进行增、删、改；如何判断是否为空数组；数组方法 push、pop、shift、unshift功能及返回值 ；对类数组对象的理解，如何转化为数组；数组有哪些原生方法；JavaScript 类数组对象的定义；数组和对象有哪些原生方法,列举一下；数组的 fill 方法；[,] 的长度；生成随机数的各种方法；如何实现数组的随机排序</p></li><li><p>谈谈对js事件循环的理解；EventLoop；DOM事件流及事件委托机制；JS事件委托、事件冒泡；document的load事件和DOMContentLoaded事件之间的区别；请解释事件循环，调用堆栈和任务队列的区别；宏任务与微任务；IE和Firefox的事件机制有何区别，如何阻止冒泡；写一个通用的事件侦听器函数;事件是什么?IE 与火狐的事件机制有什么区别? 如何阻止冒泡;三种事件模型是什么;事件委托是什么；什么是 DOM 和 BOM；js 的事件循环是什么</p></li><li><p>介绍JS有哪些内置对象；宿主对象和原生对象的区别；如何将arguments转为数组，对象的遍历方法；如何判断两个对象相等；为什么0.1+0.2 != 0.3，如何让其相等；==和===的区别；JS执行对象查找时，永远不会去查找原型的函数是哪个；JS有哪几种创建对象的方式；介绍 js 有哪些内置对象；内部属性 [[Class]] 是什么；Javascript 中,有一个函数,执行时对象查找时,永远不会去查找原型,这个函数是什么；</p></li><li><p>说说你对Promise的理解；Promise方法；promise.all 和 promise.allSettled 区别；对async/await 的理解；async/await对比Promise的优势；谈谈对promise理解，手写 Promise和 Promise.all方法；Callback；什么是 Promise 对象,什么是 Promises/A 规范；手写一个 Promise</p></li><li><p>什么是 Ajax；对AJAX的理解，实现一个AJAX请求；ajax、axios、fetch的区别；异步加载JS 的方式有哪些；js 延迟加载的方式有哪些；Ajax 是什么? 如何创建一个 Ajax；谈一谈浏览器的缓存机制；Ajax 解决浏览器缓存问题；同步和异步的区别;异步加载；异步编程的实现方式</p></li><li><p>for…in和for…of的区别；For 循环，for each和map的区别；forEach和.map()循环的主要区别，使用场景举例；如何使用for…of遍历对象；forEach和map方法有什么区别；[&quot;1 &quot;, &quot;2 &quot;, &quot;3 &quot;].map(parseInt) 答案是多少;js for 循环注意点</p></li><li><p>javascript 创建对象的几种方式；使用new创建对象的过程是什么样的；new关键字；实现一个类似关键字new功能的函数；new操作符的实现原理；new 操作符具体干了什么呢?如何实现</p></li><li><p>this指向系列问题；解释一下JS执行上下文；请简述JS中的this ；解释一下JS变量和对象;谈谈 This 对象的理解;箭头函数和普通函数区别是什么；箭头函数和普通函数有什么区别</p></li><li><p>document.write和innerHTML有何区别；document.write 和 innerHTML 的区别；DOM 操作——怎样添加、移除、移动、复制、创建和查找节点；innerHTML 与 outerHTML 的区别；</p></li><li><p>call bind apply的区别；call,apply和bind的作用是什么；手写bind方法；请说明Function.prototype.bind的用法；call() 和 .apply() 的区别；手写 call、apply 及 bind 函数</p></li><li><p>Typescript中type和interface的区别是什么；讲讲Typescript中的泛型；Typescript如何实现一个函数的重载；type和interface的区别</p></li><li><p>深拷贝、浅拷贝的区别；如何实现深拷贝和浅拷贝；object.assign和扩展运算法是深拷贝还是浅拷贝，两者区别；js 中的深浅拷贝实现;Object.assign();</p></li><li><p>ES next新特性有哪些；ES6 新语法/特性；ES6 Module；ES6知识点；ECMAScript6 怎么写 class,为什么会出现 class 这种东西</p></li><li><p>柯里化是什么，有什么用，怎么实现；JS函数与函数式编程；高阶函数；函数柯里化的实现；谈一谈你理解的函数式编程</p></li><li><p>对比 一下var、const、let；请解释变量提升；JavaScript 中的作用域与变量声明提升； let 和 const 的注意点</p></li><li><p>什么是user strict，使用它有什么优缺点；javascript 代码中的 &quot;use strict &quot;; 是什么意思 ? 使用它区别是什么</p></li><li><p>如何判断当前脚本运行在浏览器还是node环境中；如何判断当前脚本运行在浏览器还是 node 环境中?(阿里)</p></li><li><p>解构赋值 const { a = 2 } = { a: null } const { a = 2 } = { a: undefined } 上面两个 a 的值是什么</p></li><li><p>什么是尾调用，使用尾调用有什么好处；什么是 rest 参数；什么是尾调用,使用尾调用有什么好处</p></li><li><p>JS隐式转换及应用场景;匿名函数的典型应用场景；Attribute和Property的区别</p></li><li><p>迭代器(iterator)接口和生成器(generator)函数的关系</p></li><li><p>正则表达式；常用正则表达式</p></li><li><p>立即执行函数；IIFE(立即执行函数)的用法；</p></li><li><p>any、unknown、never</p></li><li><p>怎么优化 const value = a &amp;&amp; a.b &amp;&amp; a.b.c</p></li><li><p>深入浅出JSBridge，从原理到使用</p></li><li><p>jQuery.extend和jQuery.fn.extend的区别；针对jQuery性能的优化方法</p></li><li><p>oAuth实现方案；如何实现单点登录(Single Sign On)</p></li><li><p>JS编码规范；说几条写 JavaScript 的基本规范</p></li><li><p>什么是假值对象</p></li><li><p>~ 操作符的作用</p></li><li><p>eval 是做什么的</p></li><li><p>对于 JSON 的了解;开发中常用的几种 Content-Type;手写一个 jsonp</p></li><li><p>[].forEach.call($$(“<em>”),function(a){a.style.outline=“1px solid #” (~~(Math.random()</em>(1&lt;&lt;24))).toString(16)}) 能解释一下这段代码的意思吗？</p></li><li><p>需求:实现一个页面操作不会整页刷新的网站,并且能在浏览器前进、后退时正确响应。给出你的技术实现方案</p></li><li><p>移动端的点击事件的有延迟,时间是多久,为什么会有? 怎么解决这个延时</p></li><li><p>如何测试前端代码么? 知道 BDD, TDD, Unit Test 么? 知道怎么测试你的前端工程么(mocha, sinon, jasmine, qUnit…)</p></li><li><p>使用 JS 实现获取文件扩展名</p></li><li><p>escape,encodeURI,encodeURIComponent 有什么区别；Unicode 和 UTF-8 之间的关系</p></li><li><p>为什么 0.1 0.2 != 0.3?如何解决这个问题</p></li><li><p>原码、反码和补码的介绍</p></li><li><p>toPrecision 和 toFixed 和 Math.round 的区别;Math.ceil 和 Math.floor</p></li><li><p>Js 动画与 CSS 动画区别及相应实现；什么是 requestAnimationFrame</p></li><li><p>mouseover 和 mouseenter 的区别；js 拖拽功能的实现；</p></li><li><p>为什么使用 setTimeout 实现 setInterval?怎么模拟</p></li><li><p>Reflect 对象创建目的</p></li><li><p>EventEmitter 实现</p></li><li><p>一道常被人轻视的前端 JS 面试题</p></li><li><p>如何确定页面的可用性时间,什么是 Performance API?</p></li><li><p>js 中的命名规则</p></li><li><p>js 语句末尾分号是否可以省略</p></li><li><p>前端埋点的实现，说说看思路；怎么做 JS 代码 Error 统计</p></li><li><p>箭头函数和普通函数有什么区别</p></li><li><p>讲讲promise</p></li><li><p>apply、bind、call</p></li><li><p>typescript泛型</p></li><li><p>实现防抖方法</p></li><li><p>实现深拷贝和浅拷贝</p></li><li><p>讲一下event loop</p></li><li><p>如何判断数组</p></li><li><p>js数据类型</p></li><li><p>什么是柯里化</p></li><li><p>如何理解闭包</p></li><li><p>如何理解原型与原型链</p></li><li><p>js继承</p></li><li><p>类型判断</p></li><li><p>null和undefined的区别</p></li><li><p>new一个对象发生了什么</p></li><li><p>手写promise</p></li><li><p>实现Promise.all,Promise.race,Promise.any</p></li><li><p>手写promise</p></li><li><p>如何实现Promise.all、Promise.race和Promise.any方法。</p></li><li><p>Promise.all，Promise.race区别是什么？手写一个方法，使用Promise.all，实现所有都resolved/reject时才返回，并返回所有的结果</p></li><li><p>promise的catch后面跟一个then会怎么执行</p></li><li><p>callback改成promise</p></li><li><p>如何理解js的作用域</p></li><li><p>函数表达式和函数声明有什么区别</p></li><li><p>讲一下变量提升（js预编译），为什么会有变量提升？</p></li><li><p>讲讲promise，promise的3种状态和状态转换。Promise中回调函数是同步的还是异步的？then的链式调用是同步的还是异步的？</p></li><li><p>js如何判断一个变量是数组？</p></li><li><p>js数据类型都有哪些？</p></li><li><p>==和===区别</p></li><li><p>讲一下js中的包装类型</p></li><li><p>讲一下js类型的隐式转换</p></li><li><p>typeof判断哪个类型会出错？Object.prototype.toString.call()判断哪个类型会出错？</p></li><li><p>typeof能判断函数吗？能判断null吗？</p></li><li><p>如何判断一个对象为空</p></li><li><p>typeof和instanceof的区别</p></li><li><p>null和undefined有什么区别</p></li><li><p>说说Javascript中的数据类型？区别</p></li><li><p>JavaScript数组的常用方法有哪些</p></li><li><p>Javascript字符串的常用方法有哪些</p></li><li><p>谈谈 Javascript 中的类型转换机制</p></li><li><p>== 和 ===区别，分别在什么情况使用</p></li><li><p>深拷贝浅拷贝的区别？如何实现一个深拷贝</p></li><li><p>说说你对闭包的理解</p></li><li><p>说说你对作用域链的理解</p></li><li><p>JavaScript原型，原型链 ? 有什么特点</p></li><li><p>Javascript如何实现继承</p></li><li><p>谈谈this对象的理解</p></li><li><p>JavaScript中执行上下文和执行栈是什么</p></li><li><p>说说JavaScript中的事件模型</p></li><li><p>typeof 与 instanceof 区别</p></li><li><p>解释下什么是事件代理？应用场景</p></li><li><p>说说new操作符具体干了什么</p></li><li><p>ajax原理是什么？如何实现</p></li><li><p>bind、call、apply 区别？如何实现一个bind</p></li><li><p>说说你对正则表达式的理解？应用场景</p></li><li><p>说说你对事件循环的理解</p></li><li><p>DOM常见的操作有哪些</p></li><li><p>说说你对BOM的理解，常见的BOM对象你了解哪些</p></li><li><p>举例说明你对尾递归的理解，有哪些应用场景</p></li><li><p>说说 JavaScript 中内存泄漏的几种情况</p></li><li><p>Javascript本地存储的方式有哪些？区别及应用场景</p></li><li><p>说说你对函数式编程的理解？优缺点</p></li><li><p>Javascript中如何实现函数缓存？函数缓存有哪些应用场景</p></li><li><p>说说 Javascript 数字精度丢失的问题，如何解决</p></li><li><p>什么是防抖和节流？有什么区别？如何实现</p></li><li><p>如何判断一个元素是否在可视区域中</p></li><li><p>大文件上传如何做断点续传</p></li><li><p>如何实现上拉加载，下拉刷新</p></li><li><p>什么是单点登录？如何实现</p></li><li><p>web常见的攻击方式有哪些？如何防御</p></li><li><p>JavaScript深入之从原型到原型链</p></li><li><p>JavaScript深入之词法作用域和动态作用域</p></li><li><p>JavaScript深入之执行上下文栈</p></li><li><p>JavaScript深入之变量对象</p></li><li><p>JavaScript深入之作用域链</p></li><li><p>JavaScript深入之从ECMAScript规范解读this</p></li><li><p>JavaScript深入之执行上下文</p></li><li><p>JavaScript深入之闭包</p></li><li><p>JavaScript深入之参数按值传递</p></li><li><p>JavaScript深入之call和apply的模拟实现</p></li><li><p>JavaScript深入之bind的模拟实现</p></li><li><p>JavaScript深入之new的模拟实现</p></li><li><p>JavaScript深入之类数组对象与arguments</p></li><li><p>JavaScript深入之创建对象的多种方式以及优缺点</p></li><li><p>JavaScript深入之继承的多种方式以及优缺点</p></li><li><p>JavaScript深入系列15篇正式完结！</p></li><li><p>JavaScript深入之浮点数精度</p></li><li><p>JavaScript深入之头疼的类型转换(上)</p></li><li><p>JavaScript深入之头疼的类型转换(下)</p></li><li><p>JavaScript专题之跟着underscore学防抖</p></li><li><p>JavaScript专题之跟着underscore学节流</p></li><li><p>JavaScript专题之数组去重</p></li><li><p>JavaScript专题之类型判断(上)</p></li><li><p>JavaScript专题之类型判断(下)</p></li><li><p>JavaScript专题之深浅拷贝</p></li><li><p>JavaScript专题之从零实现jQuery的extend</p></li><li><p>JavaScript专题之如何求数组的最大值和最小值</p></li><li><p>JavaScript专题之数组扁平化</p></li><li><p>JavaScript专题之学underscore在数组中查找指定元素</p></li><li><p>JavaScript专题之jQuery通用遍历方法each的实现</p></li><li><p>JavaScript专题之如何判断两个对象相等</p></li><li><p>JavaScript专题之函数柯里化</p></li><li><p>JavaScript专题之偏函数</p></li><li><p>JavaScript专题之惰性函数</p></li><li><p>JavaScript专题之函数组合</p></li><li><p>JavaScript专题之函数记忆</p></li><li><p>JavaScript专题之递归</p></li><li><p>JavaScript专题之乱序</p></li><li><p>JavaScript专题之解读 v8 排序源码</p></li><li><p>JavaScript专题系列20篇正式完结！</p></li><li><p>JavaScript专题之花式表示26个字母</p></li></ol><h1>ES6</h1><ol><li><p>说说var、let、const之间的区别</p></li><li><p>ES6中数组新增了哪些扩展</p></li><li><p>ES6中对象新增了哪些扩展</p></li><li><p>ES6中函数新增了哪些扩展</p></li><li><p>ES6中新增的Set、Map两种数据结构怎么理解</p></li><li><p>你是怎么理解ES6中 Promise的？使用场景</p></li><li><p>怎么理解ES6中 Generator的？使用场景</p></li><li><p>你是怎么理解ES6中Proxy的？使用场景</p></li><li><p>你是怎么理解ES6中Module的？使用场景</p></li><li><p>你是怎么理解ES6中 Decorator 的？使用场景</p></li><li><p>ES6 系列之 let 和 const</p></li><li><p>ES6 系列之模板字符串</p></li><li><p>ES6 系列之箭头函数</p></li><li><p>ES6 系列之模拟实现 Symbol 类型</p></li><li><p>ES6 系列之迭代器与 for of</p></li><li><p>ES6 系列之模拟实现一个 Set 数据结构</p></li><li><p>ES6 系列之 WeakMap</p></li><li><p>ES6 系列之我们来聊聊 Promise</p></li><li><p>ES6 系列之 Generator 的自动执行</p></li><li><p>ES6 系列之我们来聊聊 Async</p></li><li><p>ES6 系列之异步处理实战</p></li><li><p>ES6 系列之 Babel 将 Generator 编译成了什么样子</p></li><li><p>ES6 系列之 Babel 将 Async 编译成了什么样子</p></li><li><p>ES6 系列之 Babel 是如何编译 Class 的(上)</p></li><li><p>ES6 系列之 Babel 是如何编译 Class 的(下)</p></li><li><p>ES6 系列之 defineProperty 与 proxy</p></li><li><p>ES6 系列之模块加载方案</p></li><li><p>ES6 系列之我们来聊聊装饰器</p></li><li><p>ES6 系列之私有变量的实现</p></li><li><p>ES6 完全使用手册</p></li><li><p>可选链（?.）与空值合并（??）；与 ||、&amp;&amp; 的区别</p></li><li><p>BigInt 的使用场景与限制；globalThis 是什么</p></li><li><p>Promise.allSettled、Promise.any、Promise.finally 的区别与使用场景</p></li><li><p>结构化克隆（structuredClone）与 JSON.parse/stringify 深拷贝对比</p></li><li><p>Array.at()、flatMap、findLast/findLastIndex；Object.hasOwn 与 hasOwnProperty</p></li><li><p>动态 import() 与静态 import 的区别；import.meta 的用途</p></li><li><p>WeakRef、FinalizationRegistry 是什么（了解即可）</p></li><li><p>Temporal API、Record &amp; Tuple（了解 Stage 提案即可）</p></li><li><p>顶层 await 的使用条件与打包器支持</p></li><li><p>ArrayBuffer、TypedArray、DataView 的区别</p></li><li><p>正则表达式 s、u 标志；命名捕获组</p></li><li><p>私有字段 #private、静态块 static {}、类字段声明</p></li></ol><h1>TypeScript</h1><ol><li><p>说说你对 TypeScript 的理解以及与 JavaScript 的区别；TS 的优势、局限与适用场景</p></li><li><p>TypeScript 的数据类型有哪些；基本类型、联合类型、交叉类型、字面量类型</p></li><li><p>any、unknown、never、void、null、undefined 的区别与使用场景</p></li><li><p>type 和 interface 的区别；什么时候用 type，什么时候用 interface</p></li><li><p>枚举（enum）的理解；const enum 与普通 enum 的区别；为什么不推荐滥用枚举</p></li><li><p>泛型是什么；泛型约束（extends）、默认类型参数、泛型工具类型的编写</p></li><li><p>常用工具类型：Partial、Required、Readonly、Pick、Omit、Record、Exclude、Extract、ReturnType、Parameters、Awaited 等</p></li><li><p>高级类型：条件类型、infer、映射类型、索引访问类型、模板字面量类型</p></li><li><p>类型断言（as）、非空断言（!）、类型守卫（typeof、instanceof、in、自定义 type predicate）</p></li><li><p>函数类型：可选参数、默认参数、剩余参数、函数重载的声明与实现</p></li><li><p>类：public/private/protected、readonly、抽象类、implements、装饰器（了解 Stage 3）</p></li><li><p>命名空间（namespace）与 ES Module 的区别；Triple-Slash 指令</p></li><li><p>声明合并（interface merging）；declare 关键字；.d.ts ambient 声明</p></li><li><p>严格模式相关：strictNullChecks、noImplicitAny、strictFunctionTypes 等 compilerOptions</p></li><li><p>tsconfig.json 常见配置：target、module、moduleResolution、paths、baseUrl、skipLibCheck</p></li><li><p>类型收窄与可辨识联合（discriminated union）</p></li><li><p>协变与逆变（函数参数逆变）在 TS 中的体现（了解即可）</p></li><li><p>如何在 Vue 项目中应用 TypeScript；vue-tsc、defineProps/defineEmits 类型</p></li><li><p>如何在 React 项目中应用 TypeScript；FC、PropsWithChildren、事件类型</p></li><li><p>satisfies 运算符；const 类型断言（as const）</p></li><li><p>类型体操常考题：DeepPartial、DeepReadonly、GetReturnType、TupleToUnion 等思路</p></li><li><p>anyScript 与类型安全的平衡；@ts-ignore、@ts-expect-error 的使用注意</p></li></ol><h1>Node.js</h1><ol><li><p>Node.js 是什么；与浏览器 JavaScript 运行环境的区别</p></li><li><p>Node 事件循环与浏览器 Event Loop 的区别；process.nextTick、setImmediate、setTimeout 优先级</p></li><li><p>单线程模型；为什么 Node 适合 I/O 密集型；CPU 密集型任务如何处理（worker_threads、子进程）</p></li><li><p>CommonJS 与 ES Module 在 Node 中的使用；require 与 import 的区别；__dirname、__filename 在 ESM 中的替代</p></li><li><p>模块加载机制；require 查找规则；循环依赖如何处理</p></li><li><p>Buffer 是什么；与 TypedArray 的关系；编码（utf8、base64、hex）</p></li><li><p>Stream 流：Readable、Writable、Duplex、Transform；背压（backpressure）；pipe 与 pipeline</p></li><li><p>fs 模块：同步与异步 API；fs.promises；大文件读写与流式处理</p></li><li><p>path 模块常用方法；跨平台路径处理</p></li><li><p>http/https 模块创建服务；与 Express/Koa 的关系</p></li><li><p>Express 中间件机制；洋葱模型；错误处理中间件</p></li><li><p>Koa 与 Express 的区别；ctx 对象；为什么 Koa 需要 async/await</p></li><li><p>中间件、路由、模板引擎、静态资源托管</p></li><li><p>进程（child_process）：spawn、exec、fork 的区别与使用场景</p></li><li><p>cluster 模块多进程；PM2 的作用（进程守护、负载均衡、零停机重启）</p></li><li><p>环境变量 process.env；dotenv；配置管理最佳实践</p></li><li><p>npm、yarn、pnpm 的区别；pnpm 为什么省磁盘、依赖如何隔离</p></li><li><p>package.json 中 dependencies、devDependencies、peerDependencies 的区别</p></li><li><p>npx 是什么；npm scripts 生命周期（pre/post）</p></li><li><p>Node 错误处理：Error 类型、uncaughtException、unhandledRejection</p></li><li><p>调试 Node：–inspect、Chrome DevTools、VS Code 断点</p></li><li><p>性能分析：clinic、0x、火焰图；内存泄漏排查</p></li><li><p>Node 安全：路径遍历、命令注入、原型污染；helmet、cors、rate-limit</p></li><li><p>JWT 认证流程；session 与 token 在 Node 服务中的实现思路</p></li><li><p>文件上传：multer、分片上传、断点续传在服务端如何实现</p></li><li><p>WebSocket 在 Node 中的实现（ws、socket.io）</p></li><li><p>Redis 在 Node 中的常见用途：缓存、Session、分布式锁、消息队列</p></li><li><p>消息队列：RabbitMQ、Kafka 在前端全栈中的角色（了解即可）</p></li><li><p>数据库：MongoDB（Mongoose）与 MySQL（Sequelize/TypeORM）选型</p></li><li><p>RESTful API 设计规范；GraphQL 与 REST 对比（了解）</p></li><li><p>SSR 与 Node：Nuxt、Next 服务端渲染基本原理</p></li><li><p>Serverless、Edge Runtime、Deno/Bun 与 Node 的对比（了解）</p></li><li><p>ESM 的 import.meta.url；创建 __dirname 等价写法</p></li><li><p>util.promisify、events.EventEmitter 的使用场景</p></li><li><p>Node 版本管理：nvm、engines 字段、LTS 策略</p></li></ol><h1>浏览器</h1><ol><li><p>事件流；浏览器的事件循环机制；浏览器下事件循环(Event Loop)；对浏览器事件循环的理解；Node.js的事件循环；Node和浏览器事件循环机制的区别；事件冒泡和捕获的区别；如何阻止事件冒泡；对事件委托的理解；执行顺序；process.nextTick；setImmediate 和 setTimeout;js 中倒计时的纠偏实现</p></li><li><p>浏览器架构；说说浏览器渲染页面的过程；浏览器解析流程；从输入 url 到展示的过程；输入 URL 回车后经过哪些过程；当在浏览器中输入 URL 并且按下回车之后发生了什么；DNS完整的查询过程；浏览器架构；你对浏览器的理解；介绍一下你对浏览器内核的理解；常见的浏览器内核比较； 常见浏览器所用内核；浏览器的渲染原理；渲染过程中遇到 JS 文件怎么处理?(浏览器解析过程)；什么是文档的预解析?(浏览器解析过程)；CSS 如何阻塞文档解析?(浏览器解析过程)；渲染页面时常见哪些不良现象?(浏览器渲染过程)；如何优化关键渲染路径?(浏览器渲染过程)； 什么是重绘和回流?(浏览器绘制过程)；如何减少回流?(浏览器绘制过程)；为什么操作 DOM 慢?(浏览器绘制过程)；主流浏览器内核私有属性 css 前缀；浏览器的渲染过程；浏览器渲染优化；chrome的v8引擎属于渲染引擎么，举例说一下渲染引擎有哪些;把 script 标签放在页面的最底部的 body 封闭之前和封闭之后有什么区别?浏览器会如何解析它们</p></li><li><p>垃圾回收机制；内存泄露；浏览器的垃圾回收机制；新生代（副垃圾回收器）；老生代（主垃圾回收器）；引用计数法；哪些情况会导致内存泄漏；Web Worker；讲讲js垃圾回收机制；JS内存空间的管理；如何编写高性能的 Javascript；简单介绍一下 V8 引擎的垃圾回收机制；哪些操作会造成内存泄漏；</p></li><li><p>浏览器是怎么对 HTML5 的离线储存资源进行管理和加载的呢；常见的浏览器端的存储技术有哪些；数据存储；浏览器缓存浏览器的存储有哪些及它们间的区别；cookie和session的区别；本地存储方式 cookie、sessionStorage、localStorage 、indexedDB 各个存储方式的特点，以及使用场景；请描述一下 cookies,sessionStorage 和 localStorage 的区别；</p></li><li><p>如何判断一个元素是否在可视区域中？ offsetTop、scrollTop getBoundingClientRect Intersection Observer</p></li><li><p>HTTP状态码；谈谈 HTTP 缓存 ；HTTP 缓存相关的知识，要了解浏览器请求什么时候会返回 disk cache、304、200；TCP 三次握手四次挥手的理解；HTTP 1.1 和 HTTP 2.0 的区别；HTTP 1.0/1.1/2.0/3.0 的特性；HTTP和HTTPS协议的区别；对HTTP请求中的keep-alive有了解吗；HTTP队头堵塞，TCP队头阻塞； get 请求传参长度的误区；URL 和 URI 的区别；get 和 post 请求在缓存方面的区别</p></li><li><p>OSI七层模型；TCP/IP五层协议；TCP和UDP的区别；UDP协议为什么不可靠；对 WebSocket 的理解；TCP和UDP的应用；GET和POST的请求的区别；POST和PUT请求的区别；</p></li><li><p>网络安全；Web安全举例；HTTPS；WebSocket；token可以放在cookie里吗；什么是HTTPS协议，如何加密的；TLS/SSL的工作原理；XSS（跨站脚本攻击）；CSRF（跨站请求伪造）；什么是 XSS 攻击?如何防范 XSS 攻击；什么是 CSP；什么是 CSRF 攻击?如何防范 CSRF 攻击；什么是 Samesite Cookie 属性；什么是点击劫持?如何防范点击劫持；SQL 注入攻击；</p></li><li><p>什么进程和线程，有什么区别；浏览器有哪些进程;进程间通信的方式</p></li><li><p>为什么需要浏览器缓存；协商缓存和强缓存的区别</p></li><li><p>常见浏览器所用内核；polyfill的作用；常见兼容性问题(移动端/PC端)；移动端屏幕适配；浏览器版本检测方式；功能检测、功能推断、navigator.userAgent的区别；webSocket 如何兼容低版本浏览器； 检测浏览器版本版本有哪些方式；什么是 Polyfill</p></li><li><p>跨标签页通讯；域名发散与域名收敛；什么是同源策略；如何解决跨越问题； 如何实现浏览器内多个标签页之间的通信；什么是浏览器的同源政策；如何解决跨域问题；服务器代理转发时,该如何处理 cookie；简单谈一下 cookie ；</p></li><li><p>Cookie 和 SameSite 属性</p></li></ol><h1>HTTP</h1><ol><li><p>从输入url到看到界面的过程</p></li><li><p>http各个版本的改进</p></li><li><p>https的通信过程</p></li><li><p>https为什么是安全的</p></li><li><p>前端性能优化方法</p></li><li><p>网络攻击有哪些</p></li><li><p>什么是HTTP? HTTP 和 HTTPS 的区别</p></li><li><p>为什么说HTTPS比HTTP安全? HTTPS是如何保证安全的</p></li><li><p>如何理解UDP 和 TCP? 区别? 应用场景</p></li><li><p>如何理解OSI七层模型</p></li><li><p>如何理解TCP/IP协议</p></li><li><p>DNS协议 是什么？说说DNS 完整的查询过程</p></li><li><p>如何理解CDN？说说实现原理</p></li><li><p>说说 HTTP1.0/1.1/2.0 的区别</p></li><li><p>说说HTTP 常见的状态码有哪些，适用场景</p></li><li><p>说一下 GET 和 POST 的区别</p></li><li><p>说说 HTTP 常见的请求头有哪些? 作用</p></li><li><p>说说地址栏输入 URL 敲下回车后发生了什么</p></li><li><p>说说TCP为什么需要三次握手和四次挥手</p></li><li><p>说说对WebSocket的理解？应用场景？</p></li><li><p>HTTP/3 与 QUIC 协议；与 HTTP/2 的主要区别</p></li><li><p>对称加密与非对称加密；数字证书与 CA；HTTPS 握手过程（TLS 1.2/1.3 了解）</p></li><li><p>正向代理与反向代理；Nginx 负载均衡策略（轮询、权重、ip_hash 等）</p></li><li><p>跨域预检请求（OPTIONS）；简单请求与复杂请求的判断条件</p></li><li><p>Cookie 的 Secure、HttpOnly、SameSite、Domain、Path 属性</p></li><li><p>缓存头完整梳理：Cache-Control、Expires、ETag、Last-Modified、Vary</p></li><li><p>范围请求 Range、断点续传、206 Partial Content</p></li><li><p>内容协商：Accept、Accept-Encoding、Accept-Language、Content-Encoding（gzip、br）</p></li><li><p>CORS 响应头 Access-Control-Allow-* 各字段含义</p></li><li><p>短连接与长连接；HTTP Keep-Alive；连接复用与队头阻塞</p></li><li><p>REST、GraphQL、gRPC 在前端场景下的对比（了解）</p></li><li><p>接口幂等性；GET/PUT/DELETE 的幂等；POST 如何保证幂等（Token、唯一键）</p></li><li><p>限流、熔断、降级在前端与网关层的体现（了解）</p></li></ol><h1>Vue</h1><ol><li><p>路由的钩子；vue-router的路由守卫；router和route的区别；路由传参和取参；路由钩子beforeEach三个参数；vue-router中的路由守卫有哪些；vue-router原理以及两种模式区别；vue-router用法；讲讲前端路由原理，比较一下history和hash这两种路由；前端有几种缓存方式；路由的hash和history模式的区别；router和route的区别；如何设置动态路由；路由守卫；vue-router 中的导航钩子函数；$route 和 $router 的区别；前端路由；什么是“前端路由”?什么时候适合使用“前端路由”?“前端路由”有哪些优点和缺点；Vue的路由实现:hash模式 和 history模式；Vue路由的钩子函数；vue-router原理以及两种模式区别</p></li><li><p>Virtual Dom（虚拟DOM）；diff 算法；Vue的diff算法；Vue的数据为什么频繁变化但只会更新一次；讲讲Vue的虚拟DOM原理以及好处是什么，相对于手动操作DOM性能更好吗；讲讲Vue diff算法；vue2中虚拟DOM更新时标记差异怎么实现的，介绍一下它的原理；对虚拟DOM的理解；虚拟DOM就一定比真实DOM更快吗；虚拟DOM的解析过程；DIFF算法原理；什么是 Virtual DOM?为什么 Virtual DOM 比原生 DOM 快；如何比较两个 DOM 树的差异</p></li><li><p>常见的事件修饰符及其作用；常用的属性、指令有哪些；vue常用指令；v-for和v-if放在一起用好吗； v-if和v-show的区别；v-for和v-if同时使用有问题吗；vue如何实现自定义指令；v-html 的原理；v-model 是如何实现的，语法糖实际是什么；为什么v-for和v-if不能一起使用；vue 常用的修饰符；</p></li><li><p>vue响应式原理；vue响应式原理；vue的模板渲染；vue的compile过程；vue框架原理；为什么Vue是渐进式框架；Vuex工作机制；vue3中的ref、toRef、toRefs；Object.defineProperty 介绍；使用 Object.defineProperty() 来进行数据劫持有什么缺点；什么是 Proxy</p></li><li><p>计算属性和监听属性；computed和watch的区别；vue组件watch中deep和immediate的作用；computed和method的区别；vue的computed和watch的实现原理；computed和watch区别是什么；vuex的使用；computed 和 watch 的差异；computed 和 watch 区别；vue computed和watch的区别</p></li><li><p>v-model原理；数据双向绑定原理；关于vue3双向绑定的实现；v-model的作用；vue数据双向绑定原理；讲讲Vue双向绑定原理；vue 双向数据绑定原理；Vue实现数据双向绑定的原理</p></li><li><p>Vue生命周期；vue组件的生命周期；vue父子组件挂载顺序；Vue父子组件生命周期触发顺序是怎样的；Vue 的生命周期是什么；Vue 的各个生命阶段是什么；Vue的生命周期；vue父子组件挂载顺序</p></li><li><p>vue的keep-alive组件；vue2中keep-alive怎么实现缓存效果的，它的原理是什么；说说Vue的keep-alive使用及原理；keep-alive 组件有什么作用；对keep-alive 的了解</p></li><li><p>前端常用框架对比；React、Vue和JQuery的选型；vue和jquery的区别；vue和react的区别；vue和react的区别，有什么相同；Vue与Angular以及React的区别</p></li><li><p>讲讲Vuex的使用方法；Vuex 的原理；Vuex中action和mutation的区别；Vuex 和 localStorage 的区别；Vuex是什么?怎么使用?哪种功能场景使用它</p></li><li><p>组件通信；vue父子组件通信，兄弟组件通信；vue的event bus的实现；Vue组件间通信方式有哪些；Vue 组件间的参数传递方式；Vue组件间的参数传递</p></li><li><p>vue等待视图完成更新后进行下一次操作后，这个函数叫什么；process.nextTick和Vue.nextTick；vue异步渲染、nextTick；Vue.nextTick的实现</p></li><li><p>实战技巧；vue怎么检测到数组的变化；vue2中响应式变量如何变成非响应式；vue组件样式污染；Vue如何给一个对象添加新的属性</p></li><li><p>vue中的data 为什么是个函数；vue组件data为什么是函数；vue组件data用箭头函数行不行；data为什么是一个函数而不是对象</p></li><li><p>什么是 MVVM?比之 MVC 有什么区别?什么又是 MVP ；mvvm和mvc区别是什么；MVVM的理解；对于MVVM的理解</p></li><li><p>SPA的理解，有什么优缺点；SPA和多页面有什么区别；请解释SPA(单页应用)，优缺点是什么？如何使其对SEO友好</p></li><li><p>vue3的变化（改进）；composition Api对比 option Api的优势；Vue3和Vue2的区别；Vue2和Vue3有哪些区别</p></li><li><p>Vue中key的作用；为什么不建议用index作为key；vue 中 key 值的作用</p></li><li><p>Vue-cli如何新增自定义指令；Vue如何自定义一个过滤器</p></li><li><p>mixin 和 mixins 区别；vue 中 mixin 和 mixins 区别</p></li><li><p>数据请求方面；Token怎么存</p></li><li><p>Vue.use方法的使用</p></li><li><p>Vue的性能优化有哪些</p><ul><li>编码阶段</li><li>打包优化</li><li>用户体验</li><li>SEO优化</li></ul></li><li><p>slot</p></li><li><p>v-for和v-if放在一起用好吗</p></li><li><p>vue数据双向绑定原理</p></li><li><p>Vue的diff算法</p></li><li><p>vue nextTick</p></li><li><p>vue的keep-alive组件</p></li><li><p>vue父子组件通信,兄弟组件通信</p></li><li><p>mvvm与mvc</p></li><li><p>vuex的使用</p></li><li><p>vue-router中的路由守卫有哪些</p></li><li><p>vuex的使用</p></li><li><p>v-model的作用</p></li><li><p>vue框架原理</p></li><li><p>vue常用指令</p></li><li><p>Vue3和Vue2的区别</p></li><li><p>vue父子组件挂载顺序</p></li><li><p>vue computed和watch的区别</p></li><li><p>vue组件data为什么是函数</p></li><li><p>vue组件data用箭头函数行不行</p></li><li><p>Vuex工作机制</p></li><li><p>vue-router原理以及两种模式区别</p></li><li><p>vue-router用法</p></li><li><p>v-if和v-show的区别</p></li><li><p>v-for和v-if放在一起用好吗</p></li><li><p>vue组件样式污染</p></li><li><p>Vue如何给一个对象添加新的属性</p></li><li><p>vue响应式原理</p></li><li><p>vue的compile过程</p></li><li><p>vue的computed和watch的实现原理</p></li><li><p>vue的模板渲染</p></li><li><p>vue数据双向绑定原理</p></li><li><p>vue怎么检测到数组的变化</p></li><li><p>Vue的diff算法</p></li><li><p>vue nextTick</p></li><li><p>vue的keep-alive组件</p></li><li><p>Vue的数据为什么频繁变化但只会更新一次</p></li><li><p>process.nextTick和Vue.nextTick</p></li><li><p>vue组件watch中deep和immediate的作用</p></li><li><p>slot</p></li><li><p>vue异步渲染、nextTick</p></li><li><p>vue如何实现自定义指令</p></li><li><p>Vue.use方法的使用</p></li><li><p>vue和react的区别</p></li><li><p>vue父子组件通信，兄弟组件通信</p></li><li><p>vue的event bus的实现</p></li><li><p>React、Vue和JQuery的选型</p></li><li><p>vue和jquery的区别</p></li><li><p>computed和watch的区别</p></li><li><p>computed和method的区别</p></li><li><p>vue组件的生命周期</p></li><li><p>为什么Vue是渐进式框架</p></li><li><p>mvvm与mvc</p></li><li><p>说说你对vue的理解</p></li><li><p>说说你对双向绑定的理解</p></li><li><p>说说你对SPA（单页应用）的理解</p></li><li><p>Vue中的v-show和v-if怎么理解</p></li><li><p>Vue实例挂载的过程中发生了什么</p></li><li><p>说说你对Vue生命周期的理解</p></li><li><p>为什么Vue中的v-if和v-for不建议一起用</p></li><li><p>SPA（单页应用）首屏加载速度慢怎么解决</p></li><li><p>为什么data属性是一个函数而不是一个对象</p></li><li><p>Vue中给对象添加新属性界面不刷新</p></li><li><p>Vue中组件和插件有什么区别</p></li><li><p>Vue组件间通信方式都有哪些</p></li><li><p>说说你对nextTick的理解</p></li><li><p>说说你对vue的mixin的理解，有什么应用场景</p></li><li><p>说说你对slot的理解？slot使用场景有哪些</p></li><li><p>Vue.observable你有了解过吗？说说看</p></li><li><p>你知道vue中key的原理吗？说说你对它的理解</p></li><li><p>怎么缓存当前的组件？缓存后怎么更新？说说你对keep-alive的理解是什么</p></li><li><p>Vue常用的修饰符有哪些？有什么应用场景</p></li><li><p>你有写过自定义指令吗？自定义指令的应用场景有哪些</p></li><li><p>Vue中的过滤器了解吗？过滤器的应用场景有哪些</p></li><li><p>什么是虚拟DOM？如何实现一个虚拟DOM？说说你的思路</p></li><li><p>了解过vue中的diff算法吗？说说看</p></li><li><p>Vue项目中有封装过axios吗？怎么封装的</p></li><li><p>你了解Axios的原理吗？有看过它的源码吗</p></li><li><p>SSR解决了什么问题？有做过SSR吗？你是怎么做的</p></li><li><p>说下你的Vue项目的目录结构，如果是大型项目你该怎么划分结构和划分组件呢</p></li><li><p>Vue要做权限管理该怎么做？控制到按钮级别的权限怎么做</p></li><li><p>跨域是什么？Vue项目中你是如何解决跨域的呢</p></li><li><p>Vue项目如何部署？有遇到布署服务器后刷新404问题吗</p></li><li><p>你是怎么处理vue项目中的错误的</p></li><li><p>Vue3有了解过吗？能说说跟Vue2的区别吗？</p></li><li><p>Vue3.0的设计目标是什么？做了哪些优化</p></li><li><p>Vue3.0 性能提升主要是通过哪几方面体现的</p></li><li><p>Vue3.0里为什么要用 Proxy API 替代 defineProperty API</p></li><li><p>Vue3.0 所采用的 Composition Api 与 Vue2.x 使用的 Options Api 有什么不同</p></li><li><p>说说Vue 3.0中Treeshaking特性？举例说明一下</p></li><li><p>用Vue3.0 写过组件吗？如果想实现一个 Modal你会怎么设计？</p></li><li><p>Pinia 与 Vuex 的区别；为什么 Vue3 推荐 Pinia</p></li><li><p>Pinia 的 defineStore、state、getters、actions；与 Composition API 的配合</p></li><li><p>Vue3 script setup 语法；defineProps、defineEmits、defineExpose、withDefaults</p></li><li><p>ref、reactive、toRef、toRefs、shallowRef、shallowReactive 区别与使用场景</p></li><li><p>watch、watchEffect 的区别；watch 的 flush、deep 选项</p></li><li><p>provide/inject 跨层级通信；与 props、pinia 选型</p></li><li><p>Teleport、Suspense 组件的作用与使用场景</p></li><li><p>Vue3 自定义渲染器（了解）；compiler-dom 与 runtime-core 分层</p></li><li><p>effectScope 与组合式函数中的副作用清理</p></li><li><p>Vue3 响应式 API：effect、track、trigger 原理（了解）</p></li><li><p>宏 auto-import、unplugin-vue-components 等工程化实践</p></li><li><p>Vue Router 4 与 3 的差异；createRouter、createWebHistory</p></li><li><p>Vite + Vue3 项目常见目录结构与规范</p></li></ol><h1>React</h1><ol><li><p>React 是什么；与 Vue、Angular 的对比；声明式 UI、单向数据流、虚拟 DOM</p></li><li><p>JSX 是什么；为什么需要 Babel 编译；JSX 与 createElement 的关系</p></li><li><p>类组件与函数组件的区别；为什么推荐函数组件 + Hooks</p></li><li><p>React 生命周期（类组件）：挂载、更新、卸载；componentDidMount、getDerivedStateFromProps 等</p></li><li><p>Hooks 规则：为什么不能在条件/循环中调用；Hooks 调用顺序为何重要</p></li><li><p>useState 原理与批量更新（batching）；函数式更新 setState(fn)</p></li><li><p>useEffect 与类组件生命周期的对应关系；依赖数组；清理函数 return</p></li><li><p>useLayoutEffect 与 useEffect 的区别；使用场景</p></li><li><p>useRef 与 useState 的区别；保存可变值、访问 DOM、避免闭包陷阱</p></li><li><p>useMemo、useCallback 的作用与滥用问题；何时真正需要优化</p></li><li><p>useContext 与 Context API；Provider/Consumer；性能注意点</p></li><li><p>useReducer 与 useState 选型；与 Redux 的关系</p></li><li><p>自定义 Hook 的设计与复用（useRequest、useToggle 等）</p></li><li><p>React 18 新特性：并发渲染、自动批处理、startTransition、useDeferredValue</p></li><li><p>StrictMode 双重调用在开发环境的原因</p></li><li><p>受控组件与非受控组件；表单处理；defaultValue 与 value</p></li><li><p>合成事件（SyntheticEvent）与原生事件；事件委托在 React 17+ 的变化</p></li><li><p>事件池（17 前）与 persist（了解历史即可）</p></li><li><p>setState 同步还是异步；React 18 中 setState 批处理行为</p></li><li><p>Fiber 架构是什么；可中断渲染、时间切片、双缓冲树</p></li><li><p>React 调度器（Scheduler）；优先级 Lane 模型（了解）</p></li><li><p>Diff 算法：单节点、多节点；key 的作用；为什么不建议用 index 作 key</p></li><li><p>列表渲染 key；reconciliation 过程</p></li><li><p>虚拟 DOM 一定更快吗；何时手动优化 DOM</p></li><li><p>React.memo、PureComponent 浅比较；children 导致重渲染</p></li><li><p>状态提升、状态下沉、组合 vs 继承</p></li><li><p>组件通信：props、回调、Context、状态管理库</p></li><li><p>Redux 三大原则；action、reducer、store；单向数据流</p></li><li><p>Redux 中间件；redux-thunk、redux-saga 区别</p></li><li><p>Redux Toolkit（RTK）：createSlice、configureStore、immer 集成</p></li><li><p>MobX、Zustand、Jotai、Recoil 与 Redux 对比（了解）</p></li><li><p>React Router：BrowserRouter vs HashRouter；路由参数、嵌套路由</p></li><li><p>路由守卫在 React 中如何实现（封装 ProtectedRoute）</p></li><li><p>Code Splitting：React.lazy、Suspense、动态 import</p></li><li><p>Error Boundary 错误边界；getDerivedStateFromError、componentDidCatch</p></li><li><p>Portal 与 createPortal；模态框、Tooltip 挂载到 body</p></li><li><p>forwardRef 与 useImperativeHandle</p></li><li><p>Fragment、&lt;&gt; 短语法；为什么需要 key 的列表不能用 Fragment 省略 key 问题</p></li><li><p>高阶组件（HOC）模式；render props；与 Hooks 对比</p></li><li><p>React 性能优化：memo、useMemo、useCallback、虚拟列表、windowing</p></li><li><p>长列表优化：react-window、react-virtualized</p></li><li><p>为什么要避免在 render 中创建新对象/函数作为 props</p></li><li><p>useEffect 无限循环的常见原因与修复</p></li><li><p>闭包陷阱在 Hooks 中的体现；stale closure</p></li><li><p>React 与 TypeScript：组件 Props 类型、事件类型、泛型组件</p></li><li><p>React SSR：Next.js 基本原理；hydration、同构注意事项</p></li><li><p>React 18 Streaming SSR、Suspense on Server（了解）</p></li><li><p>CSS 方案：CSS Modules、Styled-components、Tailwind、CSS-in-JS 选型</p></li><li><p>React 测试：React Testing Library、Jest、快照测试</p></li><li><p>React 19 新特性了解：Actions、use、文档元数据等（按需）</p></li><li><p>fiber 与 Concurrent Mode 对用户体验的影响</p></li><li><p>手写简易 useState、useEffect（面试常考）</p></li><li><p>说说 React 设计思想：组合、单向数据流、声明式</p></li></ol><h1>webpack</h1><ol><li><p>对webpack的理解；webpack的构建流程；Webpack构建流程简单说一下；模块打包原理知道吗；文件监听原理呢；文件指纹是什么，怎么用；说一下 Webpack 的热更新原理吧；vite和webpack的区别；谈谈你对 webpack 的看法</p></li><li><p>webpack常见的优化方案；如何优化 Webpack 的构建速度；在实际工程中，配置文件上百行乃是常事，如何保证各个loader按照预想方式工作；Webpack的Tree Shaking原理；如何提高webpack的打包速度；vite比webpack快在哪里</p></li><li><p>那你再说一说Loader和Plugin的区别，webpack中plugin和loader分别做什么，它们之间的执行顺序是怎样的；Webpack 常使用的 Loader 和 Plugin</p></li><li><p>如何减少打包后的代码体积；如何对bundle体积进行监控和分析；bundle，chunk，module是什么；什么是Code Splitting</p></li><li><p>webpack配置有哪些；使用webpack开发时，你用过哪些可以提高效率的插件；聊一聊Babel原理吧；关于babel的理解</p></li><li><p>source map是什么；生产环境怎么用；Webpack的Source Map是什么，如何配置生成Source Map</p></li><li><p>有哪些常见的Loader，你用过哪些Loader，是否写过Loader，简单描述一下编写loader的思路</p></li><li><p>有哪些常见的Plugin，你用过哪些Plugin，是否写过Plugin，简单描述一下编写Plugin的思路</p></li><li><p>说一下你对Monorepo的理解；你在项目是怎么做Monorepo；为什么pnpm快</p></li><li><p>webpack原理</p></li><li><p>webpack的tree-shaking</p></li><li><p>webpack优化</p></li><li><p>webpack的plugin和loader</p></li><li><p>常见的webpack plugin和loader</p></li><li><p>webpack使用</p></li><li><p>webpack的splitChunks的使用</p></li><li><p>webpack原理</p></li><li><p>webpack的tree-shaking</p></li><li><p>require引入的模块webpack能做Tree-Shaking吗？</p></li><li><p>webpack如何动态加载</p></li><li><p>webpack能动态加载require引入的模块吗？</p></li><li><p>webpack优化</p></li><li><p>webpack模块热重载</p></li><li><p>happypack</p></li><li><p>webpack的plugin和loader</p></li><li><p>loader的加载顺序</p></li><li><p>常见的webpack plugin和loader</p></li><li><p>说说你对webpack的理解？解决了什么问题</p></li><li><p>说说webpack的构建流程</p></li><li><p>说说webpack中常见的Loader？解决了什么问题</p></li><li><p>说说webpack中常见的Plugin？解决了什么问题</p></li><li><p>说说Loader和Plugin的区别？编写Loader，Plugin的思路</p></li><li><p>说说webpack的热更新是如何做到的？原理是什么</p></li><li><p>说说webpack proxy工作原理？为什么能解决跨域</p></li><li><p>说说如何借助webpack来优化前端性能</p></li><li><p>如何提高webpack的构建速度</p></li><li><p>与webpack类似的工具还有哪些？区别？</p></li><li><p>webpack 5 模块联邦（Module Federation）是什么；微前端场景</p></li><li><p>sideEffects 字段与 tree-shaking 的关系；package.json 如何标记无副作用</p></li><li><p>externals 配置；CDN 外链与 bundle 体积权衡</p></li><li><p>DllPlugin / DllReferencePlugin（webpack 4 常见，了解历史）</p></li><li><p>cache 持久化缓存（filesystem cache）；cache-loader、thread-loader</p></li><li><p>环境变量 DefinePlugin、EnvironmentPlugin；dotenv-webpack</p></li><li><p>打包分析：webpack-bundle-analyzer、速度分析 speed-measure-webpack-plugin</p></li><li><p>开发环境 vs 生产环境配置拆分；webpack-merge</p></li><li><p>asset modules（webpack 5）替代 file/url/raw-loader</p></li><li><p>如何处理 node_modules 中的 ES 模块与 CJS 混用</p></li></ol><h1>Vite</h1><ol><li><p>Vite 是什么；与 Webpack 的核心区别（开发时用 esbuild 预构建 + 原生 ESM，生产用 Rollup）</p></li><li><p>为什么 Vite 开发启动快；冷启动与 HMR 原理</p></li><li><p>Vite 的依赖预构建（optimizeDeps）解决什么问题；如何配置 include/exclude</p></li><li><p>Vite HMR API；import.meta.hot；边界模块更新</p></li><li><p>Vite 配置文件 vite.config.ts：root、base、server、build、plugins</p></li><li><p>Vite 插件机制；与 Rollup 插件的关系；常用插件（@vitejs/plugin-vue、react、legacy）</p></li><li><p>环境变量 import.meta.env；.env、.env.development、.env.production</p></li><li><p>路径别名 resolve.alias；与 tsconfig paths 配合</p></li><li><p>CSS 处理：CSS Modules、PostCSS、预处理器在 Vite 中的配置</p></li><li><p>静态资源引用；public 目录与 assets 区别</p></li><li><p>代码分割与动态 import；build.rollupOptions.output.manualChunks</p></li><li><p>生产构建优化：rollup-plugin-visualizer、压缩、chunk 大小警告</p></li><li><p>SSR 与 Vite：vite-plugin-ssr、官方 SSR 指南思路</p></li><li><p>Vite 如何代理跨域 devServer.proxy</p></li><li><p>legacy 插件与浏览器兼容；@vitejs/plugin-legacy</p></li><li><p>Vite 与 Webpack 迁移注意点；为什么生产仍用 Rollup 打包</p></li><li><p>Vitest 与 Vite 的关系（单元测试基于 Vite）</p></li><li><p>预渲染、SSG 在 Vite 生态中的方案（vite-ssg 等了解）</p></li><li><p>Worker 与 WebAssembly 在 Vite 中的支持</p></li><li><p>Monorepo 中使用 Vite（workspace、共享配置）</p></li></ol><h1>Rollup</h1><ol><li><p>Rollup 是什么；与 Webpack 的定位区别（库打包 vs 应用打包）</p></li><li><p>Rollup 的 Tree-shaking 为什么通常更彻底；ESM 静态分析</p></li><li><p>输入输出配置：input、output.format（es、cjs、umd、iife）</p></li><li><p>插件机制；常用插件 rollup-plugin-node-resolve、commonjs、typescript、terser</p></li><li><p>external 外部依赖不打包；globals 在 UMD 中的映射</p></li><li><p>多入口打包与 output.dir；preserveModules</p></li><li><p>Rollup 的 code splitting 与动态 import</p></li><li><p>为什么 Vue 3、Vite 生产构建选用 Rollup</p></li><li><p>Rollup 与 Webpack 选型：库开发用 Rollup、复杂应用用 Webpack/Vite</p></li><li><p>watch 模式与 rollup -c 开发体验</p></li><li><p>打包库的 package.json 字段：main、module、types、exports 条件导出</p></li><li><p>sideEffects 与 rollup treeshake 配置</p></li><li><p>@rollup/plugin-json、image、alias 等常用插件</p></li><li><p>Rollup 如何生成类型声明（配合 tsc 或 rollup-plugin-dts）</p></li><li><p>与 esbuild、swc 在构建链中的分工（了解）</p></li></ol><h1>前端性能优化</h1><ol><li><p>图片懒加载原理；前端需要注意哪些 SEO；前端性能优化 ；前端性能优化方案；图片的懒加载和预加载；</p></li><li><p>节流和防抖；谈一下防抖、节流的概念；如何实现防抖和节流；介绍一下 js 的节流与防抖</p></li><li><p>SPA首屏为什么加载慢</p></li><li><p>为什么要做性能优化</p></li><li><p>常见性能优化有哪些关键指标</p></li><li><p>性能优化方式有哪些：HTML &amp; CSS、JS、Vue、Webpack优化、网络优化</p></li><li><p>前端性能优化方法</p></li><li><p>白屏和首屏时间</p></li><li><p>浏览器渲染过程</p></li><li><p>js动画的性能问题</p></li><li><p>setTimeout和requestAnimationFrame的区别</p></li><li><p>什么会阻塞dom渲染</p></li><li><p>script标签什么情况不阻塞渲染</p></li><li><p>FP、FCP、FMP</p></li><li><p>回流和重绘</p></li><li><p>用户页面打开很慢，有哪些优化方式？</p></li><li><p>css和js加载，是同步还是异步？</p></li><li><p>Core Web Vitals：LCP、FID/INP、CLS 含义与优化手段</p></li><li><p>Performance API：performance.now、Navigation Timing、Resource Timing、LCP 观测</p></li><li><p>关键渲染路径（CRP）优化 checklist</p></li><li><p>资源优先级：preload、prefetch、preconnect 在性能优化中的实践</p></li><li><p>骨架屏、占位符、渐进式图片（LQIP、blur-up）</p></li><li><p>服务端渲染、静态生成、ISR 对首屏与 SEO 的影响</p></li><li><p>HTTP/2 多路复用、服务器推送（了解）与资源合并策略的变化</p></li><li><p>长任务（Long Task）与 Total Blocking Time（TBT）</p></li><li><p>内存与性能：Detached DOM、事件监听器未移除、定时器泄漏</p></li><li><p>Web Vitals 监控上报思路；RUM 与 Synthetic 监控区别</p></li><li><p>打包体积优化：动态 import、按需加载、分析重复依赖、替换重型库</p></li><li><p>图片格式选型 WebP/AVIF；responsive images；CDN 图片处理</p></li><li><p>字体优化：font-display、子集化、预加载 woff2</p></li><li><p>缓存策略分层：强缓存、协商缓存、Service Worker 缓存</p></li><li><p>移动端性能：触摸延迟、300ms、passive 事件监听器</p></li><li><p>离屏渲染、合成层过多问题；transform/opacity 动画优于 layout 属性</p></li></ol><h1>在线笔试题</h1><ol><li><p>js 实现一个函数,完成超过范围的两个大整数相加功能</p></li><li><p>js 如何实现数组扁平化</p></li><li><p>js 如何实现数组去重</p></li><li><p>如何求数组的最大值和最小值</p></li><li><p>如何求两个数的最大公约数</p></li><li><p>如何求两个数的最小公倍数</p></li><li><p>实现 IndexOf 方法</p></li><li><p>判断一个字符串是否为回文字符串</p></li><li><p>实现一个累加函数的功能比如 sum(1,2,3)(2).valueOf()</p></li><li><p>使用 reduce 方法实现 forEach、map、filter</p></li><li><p>设计一个简单的任务队列,要求分别在 1,3,4 秒后打印出 &quot;1 &quot;, &quot;2 &quot;, &quot;3 &quot;</p></li><li><p>如何查找一篇英文文章中出现频率最高的单词</p></li><li><p>如何检测浏览器所支持的最小字体大小</p></li><li><p>一个列表,假设有 100000 个数据,这个该怎么办</p></li><li><p>0.1 + 0.2 != 0.3原因是什么？</p></li><li><p>number类型最大值是多少？如果后台发的数据超过这个值怎么办？</p></li><li><p>12和12.0有什么区别？</p></li><li><p>实现每隔一秒输出数组中的一个数字</p></li><li><p>为什么3.toString()会报错？</p></li><li><p>代码的执行结果</p><pre><code>function Foo() {
  getName = function () {
    console.log(1)
  }
  console.log(&#39;this is &#39; + this)
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
</code></pre></li><li><p>代码的执行结果</p><pre><code>window.name = &#39;ByteDance&#39;;
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
</code></pre></li><li><p>说出代码的执行结果？如果只改最后一行怎么让它也能输出aaa？</p><pre><code>var obj = { 
  name: &#39;aaa&#39;,
  getName: function() {
      console.log(this.name);
  }
}
var get = obj.getName;
obj.getName();
get();
</code></pre></li><li><p>代码的执行结果</p><pre><code>var name = &#39;win&#39;;
const obj = {
    name: &#39;obj&#39;,
    a: () =&gt; {
        console.log(this.name);
    }
};
const obj1 = {
    name: &#39;obj1&#39;
};
obj.a.call(obj1);
</code></pre></li><li><p>说出下面代码执行结果</p><pre><code>const promise = new Promise((resolve,reject)=&gt;{
    console.log(1);
    resolve();
    console.log(2);
    reject()
})
setTimeout(()=&gt;{console.log(5)},0)
promise.then(()=&gt;{console.log(3)})
.then(()=&gt;{console.log(6)})
.catch(()=&gt;{console.log(7)})
console.log(4)
</code></pre></li><li><p>说出代码执行结果</p><pre><code>const first = () =&gt; (new Promise((resolve, reject) =&gt; {
    console.log(3);
    let p = new Promise((resolve, reject) =&gt; {
        console.log(7);
        setTimeout(() =&gt; {
            console.log(5);
            resolve();
        }, 0);
        resolve(1);
    });
    resolve(2);
    p.then((arg) =&gt; {
        console.log(arg);
    });
}));
first().then((arg) =&gt; {
    console.log(arg);
});
console.log(4);
</code></pre></li><li><p>说出代码执行结果</p><pre><code>console.log(1);
new Promise(resolve =&gt; {
    resolve();
    console.log(2);
}).then(() =&gt; {
    console.log(3);
})
setTimeout(() =&gt; {
    console.log(4);
}, 0);
console.log(5);
</code></pre></li><li><p>说出代码执行结果</p><pre><code>Promise.resolve()
.then(() =&gt; {
    console.log(&#39;1&#39;);
})
.then(() =&gt; {
    console.log(&#39;2&#39;);
});


setTimeout(() =&gt; {
    Promise.resolve()
    .then(() =&gt; {
        console.log(&#39;3&#39;);
    })
    .then(() =&gt; {
        console.log(&#39;4&#39;);
    });
    setInterval(() =&gt; {
        console.log(&#39;5&#39;);
    }, 3000);
    console.log(&#39;6&#39;);
}, 0);
</code></pre></li><li><p>说出代码执行结果</p><pre><code>setTimeout(function() {
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
new Promise((resolve, reject) =&gt; {
    console.log(3);
    resolve();
    console.log(6);
}).then(() =&gt; console.log(4))
console.log(5);
</code></pre></li><li><p>代码执行结果</p><pre><code>function fn() {
  return new Promise((resolve, reject) =&gt; {
      setTimeout(() =&gt; {
          reject(&#39;error&#39;);
      }, 1000);
  });
}
const foo = async () =&gt; {
   try {
     await fn();
  } catch (e) {
      console.log(&#39;lala&#39;, e);  // some error
  }
}
foo();
</code></pre></li><li><p>循环打印数字</p><pre><code>for (var i = 0; i &lt; 3; i++) {
    document.body.addEventListener(
        &#39;click&#39;,
        function() {
            console.log(i);
        }
    )
}
</code></pre><p>上面代码输出什么？</p><p>如果想0 1 2，怎么做？</p></li><li><p>代码执行结果</p><pre><code>var count = 10;
function a() {
 return count + 10;
}
function b() {
 var count = 20;
 return a();
}
console.log(b());
</code></pre></li><li><p>说出代码执行结果</p><pre><code>// 代码段1
console.log(a);
a = 1;


// 代码段2
console.log(b);
var b = 2; 


// 代码段3
var c = 1;
let c;
console.log(c);
</code></pre></li><li><p>说出代码执行结果</p><pre><code>// 1
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
var resource = [&#39;a.png&#39;, &#39;b.png&#39;, &#39;c.png&#39;, &#39;d.png&#39;, &#39;e.png&#39;, &#39;f.png&#39;];
for(var i = 0; i &lt; resource.length; i++) {
    var img = new Image();
    img.src = resource[i];
    img.onload = function(){
        console.log(i);
    }
}
</code></pre></li><li><p>代码执行结果</p><pre><code>var a = {
    name:1,
    age:2,
}
var b = a;
b.name = 3；


console.log(a);
console.log(b);
</code></pre></li><li><p>代码执行结果</p><pre><code>const o1 = {};
const o2 = {};
console.log(o1 == o2);
console.log(o1 === o2);
</code></pre></li><li><p>代码执行结果</p><pre><code>[] + []
[] + ![]
[] == ![]
[] == []
</code></pre></li><li><p>代码执行结果</p><pre><code>null == 0
null &gt; 0
null &lt; 0
null &gt;= 0
null &lt;= 0
</code></pre></li><li><p>代码执行结果</p><pre><code>let num = 10;
function ch(num) {
    num = 12;
}
ch(num);
console.log(num);



let obj = {};
function ch1(obj) {
    obj.a = &#39;a&#39;;
}
ch1(obj);
console.log(obj.a);
</code></pre></li><li></li><li></li></ol><h1>其他</h1><ol><li><p>类组件的生命周期，函数组件使用哪些hook来代替的哪些生命周期</p></li><li><p>对于Fiber架构理解</p></li><li><p>前端权限设计思路</p></li><li><p>微前端</p></li><li><p>前端低代码的认识</p></li><li><p>常用的git命令</p></li><li><p>git rebase和git merge的区别</p></li><li><p>设计模式的最基本原则</p></li><li><p>使用过哪些设计模式 前端开发中用的比较多的就是策略模式、单例模式、发布订阅、外观模式</p></li><li><p>那堆和栈的概念有什么区别呢</p></li><li><p>单例模式模式是什么；策略模式是什么；代理模式是什么；中介者模式是什么；适配器模式是什么；观察者模式和发布订阅模式有什么不同；发布订阅模式的实现；手写一个观察者模式</p></li><li><p>react fiber</p></li><li><p>react diff算法</p></li><li><p>函数式组件和类组件的区别</p></li><li><p>React性能优化</p></li><li><p>React列表的key</p></li><li><p>useState和userRef</p></li><li><p>常用的hook</p></li><li><p>说说你对版本管理的理解？常用的版本管理工具有哪些</p></li><li><p>说说你对Git的理解</p></li><li><p>说说Git中 fork, clone,branch这三个概念，有什么区别</p></li><li><p>说说Git常用的命令有哪些</p></li><li><p>说说Git 中 HEAD、工作树和索引之间的区别</p></li><li><p>说说对git pull 和 git fetch 的理解？有什么区别</p></li><li><p>说说你对git stash 的理解？应用场景</p></li><li><p>说说你对git rebase 和 git merge的理解？区别</p></li><li><p>说说 git 发生冲突的场景？如何解决</p></li><li><p>说说你对git reset 和 git revert 的理解？区别？</p></li><li><p>说说你对操作系统的理解？核心概念有哪些</p></li><li><p>说说什么是进程？什么是线程？区别</p></li><li><p>说说 linux系统下 文件操作常用的命令有哪些</p></li><li><p>说说 linux 系统下 文本编辑常用的命令有哪些</p></li><li><p>说说你对 linux 用户管理的理解？相关的命令有哪些</p></li><li><p>说说你对输入输出重定向和管道的理解？应用场景</p></li><li><p>说说你对 shell 的理解？常见的命令</p></li><li><p>说说对设计模式的理解？常见的设计模式有哪些</p></li><li><p>说说你对单例模式的理解？如何实现</p></li><li><p>说说你对工厂模式的理解？应用场景</p></li><li><p>说说你对策略模式的理解？应用场景</p></li><li><p>说说你对代理模式的理解？应用场景</p></li><li><p>说说你对发布订阅、观察者模式的理解？区别</p></li><li><p>Pinia 与 Vuex 的区别；Vue3 状态管理选型</p></li><li><p>微前端：qiankun、single-spa、Module Federation 方案对比</p></li><li><p>前端工程化：ESLint、Prettier、Husky、lint-staged、commitlint</p></li><li><p>CI/CD 基本概念；GitHub Actions / Jenkins 在前端项目中的典型流程</p></li><li><p>单元测试、集成测试、E2E 测试区别；Vitest、Jest、Cypress、Playwright</p></li><li><p>小程序开发：双线程模型、setData 性能、与 H5 的区别（了解）</p></li><li><p>跨端方案：Taro、uni-app、React Native、Flutter 对比（了解）</p></li><li><p>WebAssembly 在前端的应用场景（了解）</p></li><li><p>PWA：Service Worker、manifest、离线缓存、推送通知</p></li><li><p>前端监控：错误上报、性能指标、用户行为埋点、Source Map 反解</p></li><li><p>简历项目描述与 STAR 法则；如何讲解技术难点</p></li><li><p>手写题常考清单汇总：防抖节流、深拷贝、柯里化、并发控制、LRU、发布订阅</p></li><li><p>数据结构常考：栈、队列、链表、树、二叉树遍历、图 BFS/DFS（笔试）</p></li><li><p>算法常考：排序、二分、双指针、滑动窗口、动态规划入门题</p></li><li><p>设计题：短链服务、秒杀前端、无限滚动、大文件上传、权限系统前端方案</p></li><li><p>TypeScript 在大型项目中的落地：类型覆盖率、any 治理、strict 渐进开启</p></li><li><p>技术选型文档应包含哪些维度：团队熟悉度、生态、性能、维护成本</p></li><li><p>前端安全清单：XSS、CSRF、点击劫持、依赖漏洞 npm audit、CSP</p></li><li><p>浏览器存储选型决策树：Cookie / sessionStorage / localStorage / IndexedDB</p></li><li><p>SEO 与 SPA：预渲染、SSR、动态渲染（了解）</p></li><li><p>低代码平台前端架构关注点： schema 驱动、物料、渲染引擎（了解）</p></li><li><p>敏捷与前端协作：需求评审、估时、联调、提测 checklist</p></li><li><p>职业规划与项目亮点提炼（软技能面试）</p></li></ol>`,34)])]))}};export{S as category,g as cover,u as date,h as default,f as legacyPaths,d as slug,v as summary,m as tags,s as title};
