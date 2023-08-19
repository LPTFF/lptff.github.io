function createChild(parent, name) {
  var child = createObject(parent);
  child.name = name;
  return child;
}

var parent = {
  name: "Parent",
  sayHello: function () {
    console.log(`Hello, I'm ${this.name}.`);
  },
};

var child = createChild(parent, "Child");
child.sayHello();
