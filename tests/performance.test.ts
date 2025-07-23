// Converted from Ava to Jest
import { LiveElement, LiveNodeList } from '../index'
import { JSDOM } from 'jsdom'

// Helper function to create a large DOM structure
function createLargeDOM(itemCount: number) {
  const items = Array.from(
    { length: itemCount },
    (_, i) => `<span class="item" data-id="${i}">Item ${i}</span>`
  ).join('')

  return new JSDOM(`
    <!DOCTYPE html>
    <div id="root">
      ${items}
    </div>
  `)
}

// Helper function to measure execution time
function measureTime<T>(fn: () => T): { result: T; time: number } {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  return { result, time: end - start }
}

describe('LiveNodeList Performance Tests', () => {
  let dom: JSDOM

  beforeEach(() => {
    dom = new JSDOM(
      '<!DOCTYPE html><div id="root"><span class="item">One</span><span class="item">Two</span></div>'
    )

    if (typeof global.document === 'undefined') {
      global.document = dom.window.document
    }

    // Polyfill MutationObserver from JSDOM
    if (typeof global.MutationObserver === 'undefined') {
      global.MutationObserver = dom.window.MutationObserver
    }
  })

  test('performance with large number of elements', () => {
    const dom = createLargeDOM(1000)
    const document = dom.window.document

    const { time: initTime } = measureTime(() => {
      return new LiveNodeList('.item', document.getElementById('root')!)
    })

    // Initialization should be reasonably fast (less than 100ms for 1000 elements)
    expect(initTime).toBeLessThan(100)
  })

  test('array method performance on large lists', () => {
    const dom = createLargeDOM(1000)
    const list = new LiveNodeList(
      '.item',
      dom.window.document.getElementById('root')!
    )

    // Test map performance
    const { time: mapTime } = measureTime(() => {
      return list.map(item => item.textContent)
    })

    // Test filter performance,
    const { time: filterTime } = measureTime(() => {
      return list.filter(
        item => parseInt(item.getAttribute('data-id') || '0') % 2 === 0
      )
    })

    // Test find performance (worst case - last element)
    const { time: findTime } = measureTime(() => {
      return list.find(item => item.getAttribute('data-id') === '999')
    })

    // Array operations should be reasonably fast
    expect(mapTime).toBeLessThan(50)
    expect(filterTime).toBeLessThan(50)
    expect(findTime).toBeLessThan(50)
  })

  test('event listener performance with many elements', () => {
    const dom = createLargeDOM(500)
    const list = new LiveNodeList(
      '.item',
      dom.window.document.getElementById('root') as HTMLElement
    )

    let clickCount = 0
    const clickHandler = () => {
      clickCount++
    }

    // Test adding event listeners to many elements
    const { time: addListenerTime } = measureTime(() => {
      list.addEventListener('click', clickHandler)
    })

    // Test triggering events on multiple elements
    const { time: triggerTime } = measureTime(() => {
      for (let i = 0; i < 10; i++) {
        list.items[i].click()
      }
    })

    // Test removing event listeners
    const { time: removeListenerTime } = measureTime(() => {
      list.removeEventListener('click', clickHandler)
    })

    // Event operations should be reasonably fast
    expect(addListenerTime).toBeLessThan(100)
    expect(triggerTime).toBeLessThan(50)
    expect(removeListenerTime).toBeLessThan(100)

    expect(clickCount).toBe(10)
  })

  test('memory usage with large datasets', () => {
    // Test that creating and destroying large lists doesn't cause memory leaks
    const iterations = 10
    const elementCount = 100

    const { time: totalTime } = measureTime(() => {
      for (let i = 0; i < iterations; i++) {
        const dom = createLargeDOM(elementCount)
        const list = new LiveNodeList(
          '.item',
          dom.window.document.getElementById('root') as HTMLElement
        )

        // Perform some operations
        list.map(item => item.textContent)
        list.filter((_, index) => index % 2 === 0)

        let clickCount = 0
        const handler = () => {
          clickCount++
        }
        list.addEventListener('click', handler)
        list.items[0].click()
        list.removeEventListener('click', handler)
      }
    })

    // Should complete reasonably quickly
    expect(totalTime).toBeLessThan(1000)
  })

  test('diffNodeList performance', () => {
    const dom = createLargeDOM(500)
    const list = new LiveNodeList(
      '.item',
      dom.window.document.getElementById('root') as HTMLElement
    )

    // Create two large arrays for comparison
    const array1 = Array.from({ length: 250 }, (_, i) => {
      const elem = dom.window.document.createElement('span')
      elem.setAttribute('data-id', `${i}`)
      return elem
    })

    const array2 = Array.from({ length: 250 }, (_, i) => {
      const elem = dom.window.document.createElement('span')
      elem.setAttribute('data-id', `${i + 125}`) // 50% overlap
      return elem
    })

    const { time: diffTime } = measureTime(() => {
      return list.diffNodeList(array1, array2)
    })

    // Diff operation should be reasonably fast
    expect(diffTime).toBeLessThan(50)
  })

  test('iterator performance', () => {
    const dom = createLargeDOM(1000)
    const list = new LiveNodeList(
      '.item',
      dom.window.document.getElementById('root') as HTMLElement
    )

    // Test for...of iteration
    const { time: iteratorTime } = measureTime(() => {
      const texts: string[] = []
      for (const item of list) {
        texts.push(item.textContent || '')
      }
      return texts
    })

    // Test spread operator
    const { time: spreadTime } = measureTime(() => {
      return [...list]
    })

    // Iterator operations should be reasonably fast
    expect(iteratorTime).toBeLessThan(100)
    expect(spreadTime).toBeLessThan(50)
  })

  test('concurrent operations performance', () => {
    const dom = createLargeDOM(200)
    const document = dom.window.document
    const root = document.getElementById('root')
    const list = new LiveNodeList('.item', root as HTMLElement)

    let clickCount = 0
    const clickHandler = () => {
      clickCount++
    }
    list.addEventListener('click', clickHandler)

    const { time: concurrentTime } = measureTime(() => {
      // Simulate concurrent DOM modifications and array operations
      for (let i = 0; i < 50; i++) {
        // Add element
        const newElem = document.createElement('span')
        newElem.className = 'item'
        newElem.textContent = `Concurrent ${i}`
        root?.appendChild(newElem)

        // Perform array operation
        list.filter(item => !!item.textContent?.includes('Concurrent'))

        // Trigger event
        if (list.length > 0) {
          list.items[0].click()
        }

        // Remove element if list gets too large
        if (list.length > 300) {
          root?.removeChild(list.items[list.length - 1])
        }
      }
    })

    // Concurrent operations should complete in reasonable time
    expect(concurrentTime).toBeLessThan(200)
    expect(clickCount).toBeGreaterThanOrEqual(50)
  })
})

describe('LiveElement Performance Tests', () => {
  let dom: JSDOM
  let document: Document
  let root: HTMLElement

  beforeEach(() => {
    dom = createLargeDOM(100)
    document = dom.window.document
    root = document.getElementById('root')!
    global.document = document
    if (typeof global.MutationObserver === 'undefined') {
      global.MutationObserver = dom.window.MutationObserver
    }
  })

  test('performance with large number of elements', () => {
    const dom = createLargeDOM(1000)
    const document = dom.window.document
    const root = document.getElementById('root')!

    const { time: initTime } = measureTime(() => {
      return new LiveElement('.item', root)
    })

    expect(initTime).toBeLessThan(100)
  })

  test('property/method proxy and refresh performance', () => {
    const el = new LiveElement('.item', root)
    const { time: propertyTime } = measureTime(() => {
      el.className = 'perf-test'
      el.textContent = 'Performance!'
      el.getAttribute('data-id')
      el.setAttribute('data-bench', 'x')
      return el.textContent
    })

    const { time: refreshTime } = measureTime(() => {
      for (let i = 0; i < 50; i++) {
        if (el.item) root.removeChild(el.item)
        const newElem = document.createElement('span')
        newElem.className = 'item'
        newElem.textContent = 'Inserted ' + i
        root.appendChild(newElem)
        el.refresh()
      }
    })

    expect(propertyTime).toBeLessThan(10)
    expect(refreshTime).toBeLessThan(200)
  })

  test('event listener add/remove/trigger performance', () => {
    const el = new LiveElement('.item', root)
    let clickCount = 0
    const clickHandler = () => {
      clickCount++
    }

    const { time: addTime } = measureTime(() => {
      el.addEventListener('click', clickHandler)
    })

    const { time: triggerTime } = measureTime(() => {
      for (let i = 0; i < 10; i++) {
        el.item?.click()
      }
    })

    const { time: removeTime } = measureTime(() => {
      el.removeEventListener('click', clickHandler)
    })

    expect(addTime).toBeLessThan(20)
    expect(triggerTime).toBeLessThan(20)
    expect(removeTime).toBeLessThan(20)
    expect(clickCount).toBe(10)
  })

  test('memory usage with large number of refreshes', () => {
    const el = new LiveElement('.item', root)
    const { time: totalTime } = measureTime(() => {
      for (let i = 0; i < 100; i++) {
        if (el.item) root.removeChild(el.item)
        const newElem = document.createElement('span')
        newElem.className = 'item'
        newElem.textContent = 'Cycle ' + i
        root.appendChild(newElem)
        el.refresh()
      }
    })
    expect(totalTime).toBeLessThan(500)
  })
})
