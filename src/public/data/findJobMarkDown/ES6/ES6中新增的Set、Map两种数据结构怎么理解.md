ES6 引入了两种新的数据结构：`Set`（集合）和 `Map`（映射）。它们在处理数据时提供了更好的方式来存储和操作不重复的值以及键值对。下面是对 `Set` 和 `Map` 的理解以及代码示例：

### Set（集合）：

`Set` 是一种存储唯一值的集合，它不允许重复的元素。它提供了一种简单的方法来存储一组值，无论这些值是什么数据类型。

#### 使用方式：

```javascript
const uniqueNumbers = new Set();

uniqueNumbers.add(1);
uniqueNumbers.add(2);
uniqueNumbers.add(3);
uniqueNumbers.add(2); // 重复的元素不会被添加

console.log(uniqueNumbers); // 输出: Set { 1, 2, 3 }
console.log(uniqueNumbers.size); // 输出: 3
```

### Map（映射）：

`Map` 是一种存储键值对的集合，其中的键是唯一的。与对象不同，`Map` 的键可以是任意数据类型。

#### 使用方式：

```javascript
const userRoles = new Map();

userRoles.set('John', 'Admin');
userRoles.set('Alice', 'User');
userRoles.set('Bob', 'Moderator');

console.log(userRoles.get('John')); // 输出: Admin
console.log(userRoles.has('Alice')); // 输出: true

for (const [user, role] of userRoles) {
  console.log(`${user} has role: ${role}`);
}
// 输出:
// John has role: Admin
// Alice has role: User
// Bob has role: Moderator
```

在上述代码中，`Set` 和 `Map` 分别提供了一种更好的方式来存储不重复的值和键值对。它们在处理数据时可以更加高效，并且提供了一些有用的方法来操作集合和映射中的数据。