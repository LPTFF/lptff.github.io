在 ECMAScript 2015（ES6）中，JavaScript 数组获得了许多新的功能和方法来简化数组操作。以下是一些数组的新增扩展和相应的代码示例：

1. **箭头函数**（不是直接针对数组的扩展，但在数组操作中很常用）：
   箭头函数提供了更简洁的函数定义方式，适用于许多数组方法中的回调函数。

```javascript
const numbers = [1, 2, 3, 4, 5];
const squared = numbers.map(number => number * number);
console.log(squared); // 输出: [1, 4, 9, 16, 25]
```

2. **forEach**：
   `forEach` 方法用于遍历数组中的每个元素，并对每个元素执行指定的回调函数。

```javascript
const fruits = ['apple', 'banana', 'orange'];
fruits.forEach(fruit => {
  console.log(fruit);
});
// 输出:
// apple
// banana
// orange
```

3. **map**：
   `map` 方法创建一个新数组，其中包含原始数组每个元素调用回调函数后的返回值。

```javascript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(number => number * 2);
console.log(doubled); // 输出: [2, 4, 6, 8, 10]
```

4. **filter**：
   `filter` 方法创建一个新数组，其中包含符合条件的原始数组元素。

```javascript
const numbers = [1, 2, 3, 4, 5];
const evenNumbers = numbers.filter(number => number % 2 === 0);
console.log(evenNumbers); // 输出: [2, 4]
```

5. **find**：
   `find` 方法返回数组中满足条件的第一个元素，如果找不到则返回 `undefined`。

```javascript
const fruits = ['apple', 'banana', 'orange'];
const foundFruit = fruits.find(fruit => fruit === 'banana');
console.log(foundFruit); // 输出: 'banana'
```

6. **reduce**：
   `reduce` 方法将数组中的元素通过回调函数逐个累积，最终得到一个单一的值。

```javascript
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
console.log(sum); // 输出: 15
```

这些是 ES6 引入的一些数组方法扩展，它们可以使数组操作更加简洁和直观。