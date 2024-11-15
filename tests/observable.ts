import test from 'ava'
import { LiveNodeList } from '../src/'

test('title', t => {
  const list = new LiveNodeList('section')
  list.items.length = document.querySelectorAll('section').length
})
