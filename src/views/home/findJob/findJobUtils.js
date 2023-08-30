import { defineAsyncComponent } from "vue";
async function getComponents(markdownPath) {
  let dynamicComponentDefinition = null;
  try {
    const markdownPathMap = {
      "/javaScript/New 运算符做了哪些事情.md": "New 运算符做了哪些事情",
      "/javaScript/js事件委托.md": "js事件委托",
      "/javaScript/js事件流.md": "js事件流",
      "/javaScript/js常见的数据类型.md": "js常见的数据类型",
      "/javaScript/undefined 和 null.md": "undefined 和 null",
      "/javaScript/为什么 Symbol 和 bigInt 不支持 new.md":
        "为什么 Symbol 和 bigInt 不支持 new",
      "/javaScript/事件循环、宏任务、微任务.md": "事件循环、宏任务、微任务",
      "/javaScript/原型、原型链.md": "原型、原型链",
      "/javaScript/变量提升、暂时性死区、var、let、const.md":
        "变量提升、暂时性死区、var、let、const",
      "/javaScript/常用继承方案.md": "常用继承方案",
      "/javaScript/js事件循环执行循序.md": "js事件循环执行循序",
      "/javaScript/js宏任务包含哪些.md": "js宏任务包含哪些",
      "/javaScript/js微任务包含哪些.md": "js微任务包含哪些",
      "/javaScript/async 和 await 是如何处理异步任务.md":
        "async 和 await 是如何处理异步任务",
      "/javaScript/requestAnimationFrame 既不是宏任务也不是微任务.md":
        "requestAnimationFrame 既不是宏任务也不是微任务",
      "/javaScript/this 指向问题.md": "this 指向问题",
      "/javaScript/箭头函数和普通函数的区别.md": "箭头函数和普通函数的区别",
      "/javaScript/call、apply、bind的区别.md": "call、apply、bind的区别",
      "/vue/为什么data属性是一个函数而不是一个对象.md":
        "为什么data属性是一个函数而不是一个对象",
      "/vue/说说你对vue的理解.md": "说说你对vue的理解",
      "/vue/说说你对双向绑定的理解.md": "说说你对双向绑定的理解",
      "/vue/说说你对SPA（单页应用）的理解.md": "说说你对SPA（单页应用）的理解",
      "/vue/Vue中的v-show和v-if怎么理解.md": "Vue中的v-show和v-if怎么理解",
      "/vue/Vue实例挂载的过程中发生了什么.md": "Vue实例挂载的过程中发生了什么",
      "/vue/说说你对Vue生命周期的理解.md": "说说你对Vue生命周期的理解",
      "/vue/为什么Vue中的v-if和v-for不建议一起用.md":
        "为什么Vue中的v-if和v-for不建议一起用",
      "/vue/SPA（单页应用）首屏加载速度慢怎么解决.md":
        "SPA（单页应用）首屏加载速度慢怎么解决",
      "/vue/Vue中给对象添加新属性界面不刷新.md":
        "Vue中给对象添加新属性界面不刷新",
      "/vue/Vue中组件和插件有什么区别.md": "Vue中组件和插件有什么区别",
      "/vue/Vue组件间通信方式都有哪些.md": "Vue组件间通信方式都有哪些",
      "/vue/说说你对nexttick的理解.md": "说说你对nexttick的理解",
      "/vue/说说你对vue的mixin的理解，有什么应用场景.md":
        "说说你对vue的mixin的理解，有什么应用场景",
      "/vue/说说你对slot的理解，slot使用场景有哪些.md":
        "说说你对slot的理解，slot使用场景有哪些",
      "/vue/Vue.observable你有了解过吗，说说看.md":
        "Vue.observable你有了解过吗，说说看",
      "/vue/你知道vue中key的原理吗，说说你对它的理解.md":
        "你知道vue中key的原理吗，说说你对它的理解",
      "/vue/怎么缓存当前的组件，缓存后怎么更新，说说你对keep-alive的理解是什么.md":
        "怎么缓存当前的组件，缓存后怎么更新，说说你对keep-alive的理解是什么",
      "/vue/Vue常用的修饰符有哪些，有什么应用场景.md":
        "Vue常用的修饰符有哪些，有什么应用场景",
      "/vue/你有写过自定义指令吗，自定义指令的应用场景有哪些.md":
        "你有写过自定义指令吗，自定义指令的应用场景有哪些",
      "/vue/Vue中的过滤器了解吗，过滤器的应用场景有哪些.md":
        "Vue中的过滤器了解吗，过滤器的应用场景有哪些",
      "/vue/什么是虚拟DOM，如何实现一个虚拟DOM，说说你的思路.md":
        "什么是虚拟DOM，如何实现一个虚拟DOM，说说你的思路",
      "/vue/了解过vue中的diff算法吗，说说看.md":
        "了解过vue中的diff算法吗，说说看",
      "/vue/Vue项目中有封装过axios吗，怎么封装的.md":
        "Vue项目中有封装过axios吗，怎么封装的",
      "/vue/你了解Axios的原理吗，有看过它的源码吗.md":
        "你了解Axios的原理吗，有看过它的源码吗",
      "/vue/SSR解决了什么问题，有做过SSR吗，你是怎么做的.md":
        "SSR解决了什么问题，有做过SSR吗，你是怎么做的",
      "/vue/说下你的Vue项目的目录结构，如果是大型项目你该怎么划分结构和划分组件呢.md":
        "说下你的Vue项目的目录结构，如果是大型项目你该怎么划分结构和划分组件呢",
      "/vue/跨域是什么，Vue项目中你是如何解决跨域的呢.md":
        "跨域是什么，Vue项目中你是如何解决跨域的呢",
      "/vue/Vue项目如何部署，有遇到布署服务器后刷新404问题吗.md":
        "Vue项目如何部署，有遇到布署服务器后刷新404问题吗",
      "/vue/你是怎么处理vue项目中的错误的.md": "你是怎么处理vue项目中的错误的",
      "/vue/Vue要做权限管理该怎么做，控制到按钮级别的权限怎么做.md":
        "Vue要做权限管理该怎么做，控制到按钮级别的权限怎么做",
      "/vue/Vue3有了解过吗，能说说跟Vue2的区别吗.md":
        "Vue3有了解过吗，能说说跟Vue2的区别吗",
      "/vue3/Vue3.0的设计目标是什么，做了哪些优化.md":
        "Vue3.0的设计目标是什么，做了哪些优化",
      "/vue3/Vue3.0 性能提升主要是通过哪几方面体现的.md":
        "Vue3.0 性能提升主要是通过哪几方面体现的",
      "/vue3/Vue3.0里为什么要用 Proxy API 替代 defineProperty API.md":
        "Vue3.0里为什么要用 Proxy API 替代 defineProperty API",
      "/vue3/Vue3.0 所采用的 Composition Api 与 Vue2.x 使用的 Options Api 有什么不同.md":
        "Vue3.0 所采用的 Composition Api 与 Vue2.x 使用的 Options Api 有什么不同",
      "/vue3/说说Vue 3.0中Treeshaking特性.md": "说说Vue 3.0中Treeshaking特性",
      "/vue3/用Vue3.0 写过组件吗，如果想实现一个 Modal你会怎么设计.md":
        "用Vue3.0 写过组件吗，如果想实现一个 Modal你会怎么设计",
      "/ES6/说说var、let、const之间的区别.md": "说说var、let、const之间的区别",
      "/ES6/ES6中数组新增了哪些扩展.md": "ES6中数组新增了哪些扩展",
      "/ES6/ES6中对象新增了哪些扩展.md": "ES6中对象新增了哪些扩展",
      "/ES6/ES6中函数新增了哪些扩展.md": "ES6中函数新增了哪些扩展",
      "/ES6/ES6中新增的Set、Map两种数据结构怎么理解.md":
        "ES6中新增的Set、Map两种数据结构怎么理解",
      "/ES6/你是怎么理解ES6中Promise以及它的使用场景.md":
        "你是怎么理解ES6中Promise以及它的使用场景",
      "/ES6/你是怎么理解ES6中Generator以及它的使用场景.md":
        "你是怎么理解ES6中Generator以及它的使用场景",
      "/ES6/你是怎么理解ES6中Proxy以及它的使用场景.md":
        "你是怎么理解ES6中Proxy以及它的使用场景",
      "/ES6/你是怎么理解ES6中Module以及它的使用场景.md":
        "你是怎么理解ES6中Module以及它的使用场景",
      "/ES6/你是怎么理解ES6中Decorator以及它的使用场景.md":
        "你是怎么理解ES6中Decorator以及它的使用场景",
      "/typescript/说说你对 typescript 的理解以及与 javascript 的区别.md":
        "说说你对 typescript 的理解以及与 javascript 的区别",
      "/typescript/说说 typescript 的数据类型有哪些.md":
        "说说 typescript 的数据类型有哪些",
      "/typescript/说说你对 TypeScript 中枚举类型的理解及其应用场景.md":
        "说说你对 TypeScript 中枚举类型的理解及其应用场景",
      "/typescript/说说你对 TypeScript 中接口的理解及其应用场景.md":
        "说说你对 TypeScript 中接口的理解及其应用场景",
      "/typescript/说说你对 TypeScript 中类的理解及其应用场景.md":
        "说说你对 TypeScript 中类的理解及其应用场景",
      "/typescript/说说你对 TypeScript 中函数的理解及其与 JavaScript 函数的区别.md":
        "说说你对 TypeScript 中函数的理解及其与 JavaScript 函数的区别",
      "/typescript/说说你对 TypeScript 中泛型的理解及其应用场景.md":
        "说说你对 TypeScript 中泛型的理解及其应用场景",
      "/typescript/说说你对 TypeScript 中高级类型的理解？有哪些？.md":
        "说说你对 TypeScript 中高级类型的理解？有哪些？",
      "/typescript/说说你对 TypeScript 中装饰器的理解及其应用场景.md":
        "说说你对 TypeScript 中装饰器的理解及其应用场景",
      "/typescript/说说对 TypeScript 中命名空间与模块的理解及其区别.md":
        "说说对 TypeScript 中命名空间与模块的理解及其区别",
      "/typescript/说说如何在React项目中应用TypeScript.md":
        "说说如何在React项目中应用TypeScript",
      "/typescript/说说如何在Vue项目中应用TypeScript.md":
        "说说如何在Vue项目中应用TypeScript",
      "/CSS/说说你对盒子模型的理解.md": "说说你对盒子模型的理解",
      "/CSS/css选择器有哪些？优先级？哪些属性可以继承.md":
        "css选择器有哪些？优先级？哪些属性可以继承",
      "/CSS/说说em、px、rem、vh、vw区别.md": "说说em、px、rem、vh、vw区别",
      "/CSS/说说设备像素、css像素、设备独立像素、dpr、ppi 之间的区别.md":
        "说说设备像素、css像素、设备独立像素、dpr、ppi 之间的区别",
      "/CSS/css中有哪些方式可以隐藏页面元素及其区别.md":
        "css中有哪些方式可以隐藏页面元素及其区别",
      "/CSS/谈谈你对BFC的理解.md": "谈谈你对BFC的理解",
      "/CSS/元素水平垂直居中的方法有哪些，如果元素不定宽高又该怎么实现.md":
        "元素水平垂直居中的方法有哪些，如果元素不定宽高又该怎么实现",
      "/CSS/如何实现两栏布局，右侧自适应？三栏布局中间自适应呢.md":
        "如何实现两栏布局，右侧自适应？三栏布局中间自适应呢",
      "/CSS/说说flexbox（弹性盒布局模型）以及适用场景.md":
        "说说flexbox（弹性盒布局模型）以及适用场景",
      "/CSS/介绍一下grid网格布局.md": "介绍一下grid网格布局",
      "/CSS/CSS3新增了哪些新特性.md": "CSS3新增了哪些新特性",
      "/CSS/css3动画有哪些.md": "css3动画有哪些",
      "/CSS/怎么理解回流跟重绘，什么场景下会触发.md":
        "怎么理解回流跟重绘，什么场景下会触发",
      "/CSS/什么是响应式设计，响应式设计的基本原理是什么.md":
        "什么是响应式设计，响应式设计的基本原理是什么",
      "/CSS/如果要做优化，CSS提高性能的方法有哪些.md":
        "如果要做优化，CSS提高性能的方法有哪些",
      "/CSS/如何实现单行以及多行文本溢出的省略样式.md":
        "如何实现单行以及多行文本溢出的省略样式",
      "/CSS/如何使用css完成视差滚动效果.md": "如何使用css完成视差滚动效果",
      "/CSS/CSS如何画一个三角形，原理是什么.md":
        "CSS如何画一个三角形，原理是什么",
      "/CSS/让Chrome支持小于12px的文字方式有哪些及其区别.md":
        "让Chrome支持小于12px的文字方式有哪些及其区别",
      "/CSS/说说对Css预编语言的理解及其有哪些区别.md":
        "说说对Css预编语言的理解及其有哪些区别",
    };
    console.log("markdownPath", markdownPath);
    const markdownPrefix = markdownPath.split("/")[1];
    console.log("markdownPrefix", markdownPrefix);
    const markdownPathPrefixMap = {
      javaScript: "javaScript",
      vue: "vue",
      vue3: "vue3",
      ES6: "ES6",
      typescript: "typescript",
      CSS: "CSS",
    };
    if (
      markdownPathMap[markdownPath] &&
      markdownPathPrefixMap[markdownPrefix]
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          /* @vite-ignore */
          `../../../public/data/findJobMarkDown/${markdownPathPrefixMap[markdownPrefix]}/${markdownPathMap[markdownPath]}.md`
        )
      );
    } else {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          /* @vite-ignore */
          `../../../public/data/findJobMarkDown/javaScript/原型、原型链.md`
        )
      );
    }
  } catch (error) {
    console.log("getComponents error", error);
  }

  return dynamicComponentDefinition;
}
export { getComponents };
