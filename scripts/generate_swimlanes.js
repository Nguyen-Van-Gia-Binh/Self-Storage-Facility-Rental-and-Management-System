const modules = [
  './swimlanes/sl00',
  './swimlanes/sl01',
  './swimlanes/sl02',
  './swimlanes/sl03',
  './swimlanes/sl04',
  './swimlanes/sl05',
  './swimlanes/sl06_1',
  './swimlanes/sl06_2',
  './swimlanes/sl07',
];

for (const mod of modules) {
  require(mod);
}
