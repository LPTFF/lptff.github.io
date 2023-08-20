function greet(message) {
  console.log(`${message}, ${this.name}`);
}

const person = { name: "Charlie" };

const greetPerson = greet.bind(person);

greetPerson("Hey"); // 输出：Hey, Charlie
