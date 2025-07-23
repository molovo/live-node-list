import { JSDOM } from 'jsdom'
import { LiveNodeList } from '../index'

describe('LiveNodeList', () => {
  let dom: JSDOM
  let document: Document
  let root: HTMLElement

  beforeEach(() => {
    dom = new JSDOM(
      '<!DOCTYPE html><div id="root"><span class="item">One</span><span class="item">Two</span></div>'
    )
    document = dom.window.document
    root = document.getElementById('root') as HTMLElement

    // Polyfill global.document for Node.js environment
    if (typeof global.document === 'undefined') {
      global.document = dom.window.document
    }

    // Polyfill MutationObserver from JSDOM
    if (typeof global.MutationObserver === 'undefined') {
      global.MutationObserver = dom.window.MutationObserver
    }
  })

  // Helper function to create a more complex DOM structure for testing
  function createComplexDOM() {
    return new JSDOM(`
    <!DOCTYPE html>
    <div id="root">
      <span class="item" data-id="1">One</span>
      <span class="item" data-id="2">Two</span>
      <div class="container">
        <span class="item" data-id="3">Three</span>
        <p class="other">Not an item</p>
      </div>
      <span class="special">Special</span>
    </div>
  `)
  }

  test('initializes with correct elements', () => {
    const list = new LiveNodeList('.item')
    expect(list.length).toBe(2)
    expect(list.isEmpty).toBe(false)
  })

  test('initializes empty with non-existent selector', () => {
    const list = new LiveNodeList('.nonexistent')
    expect(list.length).toBe(0)
    expect(list.isEmpty).toBe(true)
  })

  test('proxies array methods correctly', () => {
    const list = new LiveNodeList('.item')
    const texts = list.map(item => item.textContent)
    expect(texts).toEqual(['One', 'Two'])
    const hasOne = list.some(item => item.textContent === 'One')
    expect(hasOne).toBe(true)
  })

  test('refresh updates the list', async () => {
    const list = new LiveNodeList('.item', root)
    await new Promise<void>(resolve => {
      list.on('update', () => {
        expect(list.length).toBe(3)
        const texts = list.map(item => item.textContent)
        expect(texts).toEqual(['One', 'Two', 'three'])
        resolve()
      })
      const newelem = document.createElement('span')
      newelem.className = 'item'
      newelem.textContent = 'three'
      root.appendChild(newelem)
    })
  })

  test('refresh handles drastic dom changes', async () => {
    const list = new LiveNodeList('.item', root)
    await new Promise<void>(resolve => {
      list.on('update', () => {
        expect(list.length).toBe(2)
        const texts = list.map(item => item.textContent)
        expect(texts).toEqual(['NewOne', 'NewTwo'])
        resolve()
      })
      root.innerHTML =
        '<span class="item">NewOne</span><span class="item">NewTwo</span>'
    })
  })

  test('adds and removes event listeners', async () => {
    const list = new LiveNodeList('.item')
    let clicked = 0
    const clickHandler = () => {
      clicked++
    }
    list.addEventListener('click', clickHandler)
    list.items[0]?.click()
    expect(clicked).toBe(1)
  })

  test('handles adding event listeners with no items', () => {
    const list = new LiveNodeList('.nonexistent')
    let clicked = 0
    const clickHandler = () => {
      clicked++
    }
    list.addEventListener('click', clickHandler)
    expect(clicked).toBe(0)
  })

  // ===== COMPREHENSIVE ARRAY METHOD TESTS =====

  test('array methods - filter', () => {
    const dom = createComplexDOM()
    const list = new LiveNodeList(
      '.item',
      dom.window.document.getElementById('root') as HTMLElement
    )

    const filtered = list.filter(item => item.getAttribute('data-id') === '1')
    expect(filtered.length).toBe(1)
    expect(filtered[0].textContent).toBe('One')
  })

  test('array methods - find and findIndex', () => {
    const dom = createComplexDOM()
    const list = new LiveNodeList(
      '.item',
      dom.window.document.getElementById('root') as HTMLElement
    )

    const found = list.find(item => item.textContent === 'Two')
    expect(found?.textContent).toBe('Two')

    const foundIndex = list.findIndex(item => item.textContent === 'Three')
    expect(foundIndex).toBe(2)

    const notFound = list.find(item => item.textContent === 'NonExistent')
    expect(notFound).toBeUndefined()

    const notFoundIndex = list.findIndex(
      item => item.textContent === 'NonExistent'
    )
    expect(notFoundIndex).toBe(-1)
  })

  test('array methods - every and includes', () => {
    const list = new LiveNodeList('.item')

    const allSpans = list.every(item => item.tagName === 'SPAN')
    expect(allSpans).toBe(true)

    const firstItem = list.items[0] as HTMLElement
    expect(list.includes(firstItem)).toBe(true)

    const nonExistentItem = document.createElement('span')
    expect(list.includes(nonExistentItem)).toBe(false)
  })

  test('array methods - indexOf and lastIndexOf', () => {
    const list = new LiveNodeList('.item')

    const firstItem = list.items[0] as HTMLElement
    expect(list.indexOf(firstItem)).toBe(0)
    expect(list.lastIndexOf(firstItem)).toBe(0)

    const nonExistentItem = document.createElement('span')
    expect(list.indexOf(nonExistentItem)).toBe(-1)
  })

  test('array methods - forEach', () => {
    const list = new LiveNodeList('.item')

    const texts: string[] = []
    list.forEach(item => {
      if (item.textContent) texts.push(item.textContent)
    })

    expect(texts).toEqual(['One', 'Two'])
  })

  test('array methods - reduce and reduceRight', () => {
    const list = new LiveNodeList('.item')

    const concatenated = list.reduce((acc, item) => acc + item.textContent, '')
    expect(concatenated).toBe('OneTwo')

    const concatenatedRight = list.reduceRight(
      (acc, item) => acc + item.textContent,
      ''
    )
    expect(concatenatedRight).toBe('TwoOne')
  })

  test('array methods - slice', () => {
    const dom = createComplexDOM()
    const list = new LiveNodeList(
      '.item',
      dom.window.document.getElementById('root') as HTMLElement
    )

    const sliced = list.slice(1, 2)
    expect(sliced.length).toBe(1)
    expect(sliced[0].textContent).toBe('Two')

    const slicedFromStart = list.slice(1)
    expect(slicedFromStart.length).toBe(2)
    expect(slicedFromStart[0].textContent).toBe('Two')
    expect(slicedFromStart[1].textContent).toBe('Three')
  })

  // ===== PROPERTY ACCESS TESTS =====

  test('length property reflects current state', async () => {
    const list = new LiveNodeList('.item', root)

    expect(list.length).toBe(2)

    const promise = new Promise<void>(resolve => {
      list.on('update', () => {
        expect(list.length).toBe(3)
        resolve()
      })
    })

    // Add an element
    const newElem = document.createElement('span')
    newElem.className = 'item'
    root?.appendChild(newElem)

    await promise
  })

  test('array indexing works correctly', () => {
    const list = new LiveNodeList('.item')

    expect(list.items[0]?.textContent).toBe('One')
    expect(list.items[1]?.textContent).toBe('Two')
    expect(list.items[2]).toBeUndefined()
  })

  test('isEmpty property works correctly', () => {
    // Test with elements
    const listWithItems = new LiveNodeList('.item', root)
    expect(listWithItems.isEmpty).toBe(false)

    // Test without elements
    const emptyList = new LiveNodeList('.nonexistent', root)
    expect(emptyList.isEmpty).toBe(true)
  })

  // ===== ITERATOR TESTS =====

  test('is iterable', () => {
    const list = new LiveNodeList('.item')
    const texts: string[] = []
    for (const item of list) {
      if (item.textContent) texts.push(item.textContent)
    }
    expect(texts).toEqual(['One', 'Two'])
  })

  test('works with spread operator', () => {
    const list = new LiveNodeList('.item')
    const array = [...list]
    expect(array.length).toBe(2)
    expect(array[0].textContent).toBe('One')
    expect(array[1].textContent).toBe('Two')
  })

  // ===== REFRESH AND DOM OBSERVATION TESTS =====

  test('detects removed elements', async () => {
    const list = new LiveNodeList('.item', root)
    expect(list.length).toBe(2)
    // Remove first element
    const firstElement = list.items[0]
    root?.removeChild(firstElement as HTMLElement)
    await new Promise<void>(resolve => {
      list.on('update', (_, oldItems) => {
        expect(list.length).toBe(1)
        expect(oldItems.length).toBe(1)
        expect(oldItems[0]).toBe(firstElement)
        expect(list.length).toBe(1)
        expect(list.items[0]?.textContent).toBe('Two')
        resolve()
      })
    })
  })

  test('diffNodeList method works correctly', () => {
    const list = new LiveNodeList('.item')
    const elem1 = document.createElement('span')
    const elem2 = document.createElement('span')
    const elem3 = document.createElement('span')
    const arrayA = [elem1, elem2]
    const arrayB = [elem2, elem3]
    const diff = list.diffNodeList(arrayA, arrayB)
    expect(diff.length).toBe(1)
    expect(diff[0]).toBe(elem1)
  })

  // ===== EVENT LISTENER TESTS =====

  test('attachEventListeners and detachEventListeners', () => {
    const list = new LiveNodeList('.item')
    let clickCount = 0
    const clickHandler = () => {
      clickCount++
    }
    list.addEventListener('click', clickHandler)
    list.items[0]?.click()
    expect(clickCount).toBe(1)
    list.detachEventListeners()
    list.items[0]?.click()
    expect(clickCount).toBe(1)
    list.attachEventListeners()
    list.items[0]?.click()
    expect(clickCount).toBe(2)
  })

  test('multiple event listeners of same type', () => {
    const list = new LiveNodeList('.item')
    let count1 = 0
    let count2 = 0
    const handler1 = () => {
      count1++
    }
    const handler2 = () => {
      count2++
    }
    list.addEventListener('click', handler1)
    list.addEventListener('click', handler2)
    list.items[0]?.click()
    expect(count1).toBe(1)
    expect(count2).toBe(1)
    list.removeEventListener('click', handler1)
    list.items[0]?.click()
    expect(count1).toBe(1)
    expect(count2).toBe(2)
  })

  test('event listener options', () => {
    const list = new LiveNodeList('.item')
    let clickCount = 0
    const clickHandler = () => {
      clickCount++
    }
    list.addEventListener('click', clickHandler, { once: true })
    list.items[0]?.click()
    expect(clickCount).toBe(1)
    list.items[0]?.click()
    expect(clickCount).toBe(1)
  })

  // ===== EDGE CASE TESTS =====

  test('with undefined parent element', () => {
    const list = new LiveNodeList('.item')
    expect(list.length).toBe(2)
    expect(list.isEmpty).toBe(false)
  })

  test('with invalid selector', () => {
    // Test with CSS selector that doesn't match anything
    const list = new LiveNodeList('invalid-selector-that-does-not-exist', root)
    expect(list.length).toBe(0)
    expect(list.isEmpty).toBe(true)
  })

  test('with complex CSS selectors', () => {
    const dom = createComplexDOM()
    const document = dom.window.document
    // Test descendant selector
    const descendantList = new LiveNodeList(
      '.container .item',
      document.getElementById('root') as HTMLElement
    )
    expect(descendantList.length).toBe(1)
    expect(descendantList.items[0]?.textContent).toBe('Three')
    // Test attribute selector
    const attributeList = new LiveNodeList(
      '[data-id="2"]',
      document.getElementById('root') as HTMLElement
    )
    expect(attributeList.length).toBe(1)
    expect(attributeList.items[0]?.textContent).toBe('Two')
  })

  test('with empty array methods on empty list', () => {
    const emptyList = new LiveNodeList('.nonexistent', root)

    // Test all array methods with empty list
    expect(emptyList.filter(() => true)).toEqual([])
    expect(emptyList.find(() => true)).toBeUndefined()
    expect(emptyList.findIndex(() => true)).toBe(-1)
    expect(emptyList.every(() => false)).toBe(true) // vacuous truth
    expect(emptyList.some(() => true)).toBe(false)
    expect(emptyList.map(x => x)).toEqual([])
    expect(emptyList.slice()).toEqual([])

    // Reduce with empty array should return initial value
    expect(emptyList.reduce(acc => acc, 'initial')).toBe('initial')
    expect(emptyList.reduceRight(acc => acc, 'initial')).toBe('initial')
  })

  test('event listeners on same handler added multiple times', () => {
    const list = new LiveNodeList('.item')

    let clickCount = 0
    const clickHandler = () => {
      clickCount++
    }

    // Add same handler multiple times
    list.addEventListener('click', clickHandler)
    list.addEventListener('click', clickHandler)
    list.addEventListener('click', clickHandler)

    list.items[0]?.click()

    // Should only fire once per element because it's the same function reference
    expect(clickCount).toBe(1)
  })

  test('event listeners with different event types', () => {
    const list = new LiveNodeList('.item')

    let clickCount = 0
    let mouseoverCount = 0

    const clickHandler = () => {
      clickCount++
    }
    const mouseoverHandler = () => {
      mouseoverCount++
    }

    list.addEventListener('click', clickHandler)
    list.addEventListener('mouseover', mouseoverHandler)

    // Simulate events
    list.items[0]?.click()
    const EventClass =
      list.items[0]?.ownerDocument.defaultView?.MouseEvent || MouseEvent
    list.items[0]?.dispatchEvent(new EventClass('mouseover'))

    expect(clickCount).toBe(1)
    expect(mouseoverCount).toBe(1)
  })

  test('refresh with rapid DOM changes', async () => {
    const list = new LiveNodeList('.item', root)

    const elems: HTMLElement[] = []
    // Rapid additions and removals
    for (let i = 0; i < 5; i++) {
      const elem = document.createElement('span')
      elem.className = 'item'
      elem.textContent = `Dynamic${i}`
      elems.push(elem)
    }

    const addPromise = new Promise<void>(resolve => {
      list.on('update', () => {
        expect(list.length).toBe(7) // 2 original + 5 new
        resolve()
      })
    })

    root?.append(...elems)
    await addPromise
  })

  test('with deeply nested elements', () => {
    const nestedDOM = new JSDOM(`
    <!DOCTYPE html>
    <div id="root">
      <div class="level1">
        <div class="level2">
          <div class="level3">
            <span class="item">Deeply nested</span>
          </div>
        </div>
      </div>
    </div>
  `)

    const list = new LiveNodeList(
      '.item',
      nestedDOM.window.document.getElementById('root') as HTMLElement
    )

    expect(list.length).toBe(1)
    expect(list.items[0]?.textContent).toBe('Deeply nested')
  })

  test('diffNodeList with identical arrays', () => {
    const list = new LiveNodeList('.item')

    const elem1 = document.createElement('span')
    const elem2 = document.createElement('span')
    const array = [elem1, elem2]

    const diff = list.diffNodeList(array, array)
    expect(diff.length).toBe(0)
  })

  test('diffNodeList with empty arrays', () => {
    const list = new LiveNodeList('.item')

    const elem1 = document.createElement('span')
    const nonEmptyArray = [elem1]
    const emptyArray: HTMLElement[] = []

    const diff1 = list.diffNodeList(nonEmptyArray, emptyArray)
    expect(diff1.length).toBe(1)
    expect(diff1[0]).toEqual(elem1)

    const diff2 = list.diffNodeList(emptyArray, nonEmptyArray)
    expect(diff2.length).toBe(0)

    const diff3 = list.diffNodeList(emptyArray, emptyArray)
    expect(diff3.length).toBe(0)
  })

  test('array methods with callback context (thisArg)', () => {
    const list = new LiveNodeList('.item')

    const context = { prefix: 'Item: ' }

    const mapped = list.map(function (item) {
      return this.prefix + item.textContent
    }, context)

    expect(mapped).toEqual(['Item: One', 'Item: Two'])

    const found = list.find(
      function (item) {
        return item.textContent === this.target
      },
      { target: 'Two' }
    )

    expect(found?.textContent).toBe('Two')
  })

  test('includes with fromIndex parameter', () => {
    const dom = createComplexDOM()
    const list = new LiveNodeList(
      '.item',
      dom.window.document.getElementById('root') as HTMLElement
    )

    const secondItem = list.items[1]

    expect(list.includes(secondItem as HTMLElement, 0)).toBe(true)
    expect(list.includes(secondItem as HTMLElement, 1)).toBe(true)
    expect(list.includes(secondItem as HTMLElement, 2)).toBe(false)
  })

  test('indexOf and lastIndexOf with fromIndex', () => {
    // Add duplicate element to test lastIndexOf
    const duplicateItem = root?.children[0]?.cloneNode(true) as HTMLElement
    root?.appendChild(duplicateItem)

    const list = new LiveNodeList('.item', root)
    const firstItem = list.items[0]

    expect(list.indexOf(firstItem as HTMLElement, 0)).toBe(0)
    expect(list.indexOf(firstItem as HTMLElement, 1)).toBe(-1) // Not found after index 1
    expect(list.lastIndexOf(firstItem as HTMLElement)).toBe(0) // Only one instance, so same as indexOf
  })

  test('attachEventListeners with specific items', () => {
    const list = new LiveNodeList('.item')

    let clickCount = 0
    const clickHandler = () => {
      clickCount++
    }

    list.addEventListener('click', clickHandler)

    // Create new element but don't add to DOM yet
    const newElem = document.createElement('span')
    newElem.className = 'item'

    // Attach event listeners to specific items
    list.attachEventListeners([newElem])

    newElem.click()
    expect(clickCount).toBe(1)
  })

  test('detachEventListeners with specific items', () => {
    const list = new LiveNodeList('.item')

    let clickCount = 0
    const clickHandler = () => {
      clickCount++
    }

    list.addEventListener('click', clickHandler)

    // Test initial state
    list.items[0]?.click()
    expect(clickCount).toBe(1)

    // Detach from only first item
    list.detachEventListeners([list.items[0] as HTMLElement])

    list.items[0]?.click() // Should not increment
    list.items[1]?.click() // Should increment

    expect(clickCount).toBe(2)
  })
})
