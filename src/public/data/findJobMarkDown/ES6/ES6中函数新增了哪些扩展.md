在 ECMAScript 2015（ES6）中，JavaScript 函数也获得了一些新的功能和语法扩展。以下是一些函数的新增扩展和相应的代码示例：

1. **箭头函数**：
   箭头函数是一种更简洁的函数定义方式，通常用于匿名函数或简单的函数表达式。

```javascript
// 传统函数表达式
const add = function(a, b) {
  return a + b;
};

// 箭头函数
const addArrow = (a, b) => a + b;
```

2. **默认参数值**：
   ES6 允许在函数定义时为参数指定默认值，简化了函数调用时的参数传递。

```javascript
function greet(name = 'Guest') {
  console.log(`Hello, ${name}!`);
}

greet();         // 输出: Hello, Guest!
greet('Alice');  // 输出: Hello, Alice!
```

3. **剩余参数**：
   剩余参数语法允许将多个参数收集到一个数组中，方便处理不定数量的参数。

```javascript
function sum(...numbers) {
  return numbers.reduce((total, num) => total + num, 0);
}

console.log(sum(1, 2, 3, 4)); // 输出: 10
```

4. **展开操作符**：
   展开操作符可以将一个数组展开成独立的参数，适用于将数组元素传递给函数。

```javascript
function greet(firstName, lastName) {
  console.log(`Hello, ${firstName} ${lastName}!`);
}

const name = ['John', 'Doe'];
greet(...name); // 输出: Hello, John Doe!
```

5. **函数名属性**：
   函数现在有一个只读的 `name` 属性，用于返回函数的名称。

```javascript
function sayHi() {
  console.log('Hi!');
}

console.log(sayHi.name); // 输出: sayHi
```

6. **模板字面量和标签函数**：
   模板字面量（Template literals）允许在字符串中插入变量，标签函数则可以自定义字符串的处理方式。

```javascript
function tagFunction(strings, ...values) {
  console.log(strings); // 字符串数组
  console.log(values);  // 值数组
}

const name = 'Alice';
const age = 30;
tagFunction`Name: ${name}, Age: ${age}`;
// 输出:
// [ 'Name: ', ', Age: ', '' ]
// [ 'Alice', 30 ]
```

这些是 ES6 中一些关于函数的新增特性和语法，它们可以使函数定义和调用更加灵活和方便。