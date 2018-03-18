const nameToId = require('./nameToId')

test('converts name to lower case', () => {
  expect(nameToId('HELLO')).toEqual('hello')
})

test('converts white space to hyphens', () => {
  expect(nameToId('Hello World')).toEqual('hello-world')
})
