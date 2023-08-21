console.log("Sync 1");

setTimeout(() => {
  console.log("Timeout 1");
}, 0);

setTimeout(() => {
  console.log("Timeout 2");
}, 0);
Promise.resolve().then(() => {
  console.log("Promise Microtask 1");
});

console.log("Sync 2");
