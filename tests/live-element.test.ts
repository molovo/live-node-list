// Jest tests for LiveElement (mirroring LiveNodeList test structure)
import { LiveElement } from '../index'
import { JSDOM } from 'jsdom'

describe('LiveElement', () => {
  let dom: JSDOM
  let document: Document
  let root: HTMLElement

  beforeEach(() => {
    dom = new JSDOM(
      '<!DOCTYPE html><div id="root"><span id="one" class="item">One</span><span id="two" class="item">Two</span></div>'
    )
    document = dom.window.document
    root = document.getElementById('root')!

    if (typeof global.document === 'undefined') {
      global.document = document
    }

    if (typeof global.MutationObserver === 'undefined') {
      global.MutationObserver = dom.window.MutationObserver
    }
  })

  test('constructs and matches single element', () => {
    const el = new LiveElement('.item', root)
    expect(el.item).toBeInstanceOf(dom.window.HTMLElement)
    expect(el.isEmpty).toBe(false)
    expect(el.item!.textContent).toBe('One')
  })

  test('isEmpty is true when no match', () => {
    const el = new LiveElement('.notfound', root)
    expect(el.item).toBeUndefined()
    expect(el.isEmpty).toBe(true)
  })

  test('proxies DOM properties and methods', () => {
    const el = new LiveElement('#one', root)
    expect(el.id).toBe('one')
    el.className = 'changed'
    expect(el.className).toBe('changed')
    el.textContent = 'Modified'
    expect(el.textContent).toBe('Modified')
    el.setAttribute('data-test', 'abc')
    expect(el.getAttribute('data-test')).toBe('abc')
  })

  test('addEventListener and removeEventListener', () => {
    const el = new LiveElement('#one', root)
    let clicked = false
    const handler = () => {
      clicked = true
    }
    el.addEventListener('click', handler)
    el.item!.click()
    expect(clicked).toBe(true)
    clicked = false
    el.removeEventListener('click', handler)
    el.item!.click()
    expect(clicked).toBe(false)
  })

  test('attachEventListeners and detachEventListeners work on item', () => {
    const el = new LiveElement('#one', root)
    let counter = 0
    const handler = () => {
      counter++
    }
    el.addEventListener('click', handler)
    el.detachEventListeners()
    el.item!.click()
    expect(counter).toBe(0)
    el.attachEventListeners()
    el.item!.click()
    expect(counter).toBe(1)
  })

  test('refresh updates .item when DOM changes', () => {
    const el = new LiveElement('.item', root)
    expect(el.item?.id).toBe('one')
    // Remove first and add a new element
    root.removeChild(el.item!)
    const newElem = document.createElement('span')
    newElem.className = 'item'
    newElem.id = 'three'
    newElem.textContent = 'Three'
    root.appendChild(newElem)
    el.refresh()
    expect(el.item?.id === 'two' || el.item?.id === 'three').toBe(true)
  })

  test('works with no parent specified (defaults to document.documentElement)', () => {
    const el = new LiveElement('body')
    // In JSDOM, body always exists
    expect(el.item?.tagName).toBe('BODY')
  })

  test('className, id, innerHTML, innerText, value can be set and read', () => {
    const el = new LiveElement('#one', root)
    el.className = 'foo bar'
    el.id = 'changed-id'
    el.innerHTML = '<b>Bold</b>'
    el.innerText = 'Text!'
    expect(el.className).toBe('foo bar')
    expect(el.id).toBe('changed-id')
    expect(el.innerHTML).toBe('<b>Bold</b>')
    expect(el.innerText).toBe('Text!')
  })

  test('item proxies removal and insertion', () => {
    const el = new LiveElement('#one', root)
    expect(root.contains(el.item!)).toBe(true)
    el.remove()
    expect(root.contains(el.item!)).toBe(false)
    // Re-insert and test appendChild
    root.appendChild(el.item as HTMLElement)
    const child = document.createElement('em')
    el.appendChild(child)
    expect(el.item?.contains(child)).toBe(true)
  })

  test('handles missing element after refresh', () => {
    const el = new LiveElement('.item', root)
    expect(el.isEmpty).toBe(false)
    root.removeChild(el.item!)
    el.refresh()
    expect(el.item).toBeDefined() // Still finds next matching
    // Remove all
    Array.from(root.querySelectorAll('.item')).forEach(e => root.removeChild(e))
    el.refresh()
    expect(el.item).toBeUndefined()
    expect(el.isEmpty).toBe(true)
  })
})
