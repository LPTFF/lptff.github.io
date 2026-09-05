在 ECMAScript 2015（ES6）中，JavaScript 对象也获得了一些新的功能和语法来简化对象的创建和操作。以下是一些对象的新增扩展和相应的代码示例：

1. **对象字面量的扩展语法**：
   ES6 引入了更灵活的对象字面量语法，允许在对象属性的声明中使用变量和函数。

```javascript
const name = 'John';
const age = 30;

const person = {
  name, // 等同于 name: name
  age,  // 等同于 age: age
  greet() {
    console.log(`Hello, my name is ${this.name} and I'm ${this.age} years old.`);
  }
};

person.greet(); // 输出: Hello, my name is John and I'm 30 years old.
```

2. **计算属性名**：
   可以在对象字面量中使用计算属性名，允许动态地创建属性。

```javascript
const propertyName = 'age';
const person = {
  name: 'Alice',
  [propertyName]: 25 // 动态创建属性
};

console.log(person.age); // 输出: 25
```

3. **对象解构赋值**：
   对象解构赋值允许从对象中提取属性值并赋给变量。

```javascript
const person = {
  name: 'Bob',
  age: 28
};

const { name, age } = person;
console.log(name); // 输出: 'Bob'
console.log(age);  // 输出: 28
```

4. **展开操作符**：
   展开操作符允许将一个对象的属性展开到另一个对象中。

```javascript
const person = {
  name: 'Charlie',
  age: 22
};

const personWithInfo = {
  ...person,
  city: 'New York'
};

console.log(personWithInfo);
// 输出: { name: 'Charlie', age: 22, city: 'New York' }
```

5. **Object.assign** 方法：
   `Object.assign` 方法用于将一个或多个对象的属性复制到目标对象。

```javascript
const person = {
  name: 'David'
};

const info = {
  age: 35,
  city: 'Los Angeles'
};

const merged = Object.assign({}, person, info);
console.log(merged);
// 输出: { name: 'David', age: 35, city: 'Los Angeles' }
```

6. **Symbol** 数据类型：
   ES6 引入了一种新的数据类型 `Symbol`，用于创建独一无二的属性键，以避免属性冲突。

```javascript
const uniqueKey = Symbol('description');
const obj = {
  [uniqueKey]: 'This is a unique property'
};

console.log(obj[uniqueKey]); // 输出: 'This is a unique property'
```

这些是 ES6 中一些关于对象的新增特性和语法，它们可以让对象的创建和操作更加灵活和方便。