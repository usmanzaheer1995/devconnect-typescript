const add = (a: number, b: number) => a + b; 

test('should run', () => {
  const sum = add(3, 2);
  expect(sum).toBe(5);
});
