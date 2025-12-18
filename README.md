# LiveNodeList

An alternative to NodeList which keeps collections up to date when changes to the DOM occur.

## Install

```
npm install live-node-list
```

## Usage

Use the LiveNodeList constructor anywhere you would normally use `Element.querySelectorAll()`.

```js
const items = new LiveNodeList('.item')
```

LiveNodeList creates a [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) instance to monitor for childList and subtree changes within the parent, and refreshes the list of items whenever the childList changes.

By default, LiveNodeList selects within `document.documentElement`, but you can limit the scope of the query by passing in a parent element as a second parameter.

```js
const items = new LiveNodeList('.item', document.getElementById('my-container'))
```

By default, LiveNodeList only monitors for subtree and childList changes to keep performance snappy. However, you can override the default [MutationObserver options](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe#options) by passing in a third parameter:

```js
const activeTabs = new LiveNodeList(
  '.tab[aria-expanded="true"]',
  document.documentElement,
  {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-expanded'],
  }
)
```

### Event Listeners

LiveNodeList also maintains an internal list of event listeners, and exposes `addEventListener()` and `removeEventListener()` methods. Adding an event listener will cascade it to each of the items in the list, and will handle attaching the event listener to new items when the list of items changes.

```js
const fn = () => {}
const items = new LiveNodeList('.item')
items.addEventListener('click', fn)
items.removeEventListener('click', fn)
```

### Delegated Event Listeners

As well as applying event listeners to the items in the list, you can also add 'delegated' event listeners - that is event listeners attached to another element, that are removed when there are no items in the LiveNodeList, and added again once items are present.

This is useful, for example adding an event listener for the scroll event to the `window`, within which you access the items in the list. When there are no items in the list, the event listener is redundant, so removing it will increase scroll performance.

```js
const items = new LiveNodeList('.item')
const onScroll = e => {
  items.forEach(item => (item.innerHTML = item.getBoundingClientRect().top))
}

items.addDelegatedEventListener(window, 'scroll', onScroll, { passive: true })
```

### Internal Events

LiveNodeList also triggers its own `update` event when the list of items changes.

```js
const items = new LiveNodeList('.item')
items.on('update', (newItems, oldItems) => {
  // Do something
})
```

The other supported internal events are as follows:

- `start` - fired when observation first begins
- `pause` - fired when the `pause()` method is called
- `resume` - fired when the `resume()` method is called
- `eventListeners:add` - fired when an event listener is added to the list
- `eventListeners:remove` - fired when an event listener is removed from the list
- `eventListeners:attach` - fired when the stored event listeners are attached
- `eventListeners:detach` - fired when the stored event listeners are detached
- `eventListeners:purge` - fired when the list of event listeners is purged

### Methods

LiveNodeList proxies a number of methods from Array prototype, which are called on the internal list of items. Methods which modify the original array are not proxied, so that the contents always reflect the DOM.

The full list of proxied methods is as follows:

- [`every`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every)
- [`filter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
- [`find`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find)
- [`findIndex`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex)
- [`forEach`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
- [`includes`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes)
- [`indexOf`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf)
- [`lastIndexOf`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/lastIndexOf)
- [`map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
- [`reduce`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
- [`reduceRight`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduceRight)
- [`slice`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice)
- [`some`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some)

## LiveElement

LiveNodeList also comes with a `LiveElement` class, which is used to attach a single element, and is useful as a replacement for `Element.querySelector` which provides the same API as LiveNodeList.

```js
import { LiveElement } from 'live-node-list'

const item = new LiveElement('#item')
item.addEventListener('change', fn)

item.on('update', (newItem, oldItem) => {
  // Do something
})
```

### Methods

Like LiveNodeList, LiveElement also proxies a number of properties and methods from the Element and HTMLElement prototypes, which are called on the internal element.

The full list of proxied properties and methods is as follows:

- Inherited properties:

  - [`attributes`](https://developer.mozilla.org/en-US/docs/Web/API/Element/attributes)
  - [`childElementCount`](https://developer.mozilla.org/en-US/docs/Web/API/Element/childElementCount)
  - [`childNodes`](https://developer.mozilla.org/en-US/docs/Web/API/Element/childNodes)
  - [`children`](https://developer.mozilla.org/en-US/docs/Web/API/Element/children)
  - [`clientHeight`](https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight)
  - [`clientLeft`](https://developer.mozilla.org/en-US/docs/Web/API/Element/clientLeft)
  - [`clientTop`](https://developer.mozilla.org/en-US/docs/Web/API/Element/clientTop)
  - [`clientWidth`](https://developer.mozilla.org/en-US/docs/Web/API/Element/clientWidth)
  - [`classList`](https://developer.mozilla.org/en-US/docs/Web/API/Element/classList)
  - [`className`](https://developer.mozilla.org/en-US/docs/Web/API/Element/className)
  - [`firstElementChild`](https://developer.mozilla.org/en-US/docs/Web/API/Element/firstElementChild)
  - [`id`](https://developer.mozilla.org/en-US/docs/Web/API/Element/id)
  - [`innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML)
  - [`innerText`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerText)
  - [`lastElementChild`](https://developer.mozilla.org/en-US/docs/Web/API/Element/lastElementChild)
  - [`localName`](https://developer.mozilla.org/en-US/docs/Web/API/Element/localName)
  - [`namespaceURI`](https://developer.mozilla.org/en-US/docs/Web/API/Element/namespaceURI)
  - [`nextElementSibling`](https://developer.mozilla.org/en-US/docs/Web/API/Element/nextElementSibling)
  - [`onfullscreenchange`](https://developer.mozilla.org/en-US/docs/Web/API/Element/onfullscreenchange)
  - [`onfullscreenerror`](https://developer.mozilla.org/en-US/docs/Web/API/Element/onfullscreenerror)
  - [`outerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML)
  - [`ownerDocument`](https://developer.mozilla.org/en-US/docs/Web/API/Element/ownerDocument)
  - [`part`](https://developer.mozilla.org/en-US/docs/Web/API/Element/part)
  - [`prefix`](https://developer.mozilla.org/en-US/docs/Web/API/Element/prefix)
  - [`previousElementSibling`](https://developer.mozilla.org/en-US/docs/Web/API/Element/previousElementSibling)
  - [`scrollHeight`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight)
  - [`scrollLeft`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft)
  - [`scrollTop`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop)
  - [`scrollWidth`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollWidth)
  - [`shadowRoot`](https://developer.mozilla.org/en-US/docs/Web/API/Element/shadowRoot)
  - [`slot`](https://developer.mozilla.org/en-US/docs/Web/API/Element/slot)
  - [`style`](https://developer.mozilla.org/en-US/docs/Web/API/Element/style)
  - [`tabIndex`](https://developer.mozilla.org/en-US/docs/Web/API/Element/tabIndex)
  - [`tagName`](https://developer.mozilla.org/en-US/docs/Web/API/Element/tagName)
  - [`textContent`](https://developer.mozilla.org/en-US/docs/Web/API/Element/textContent)

- Inherited methods:
  - [`append`](https://developer.mozilla.org/en-US/docs/Web/API/Element/append)
  - [`appendChild`](https://developer.mozilla.org/en-US/docs/Web/API/Element/appendChild)
  - [`closest`](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)
  - [`cloneNode`](https://developer.mozilla.org/en-US/docs/Web/API/Element/cloneNode)
  - [`compareDocumentPosition`](https://developer.mozilla.org/en-US/docs/Web/API/Element/compareDocumentPosition)
  - [`contains`](https://developer.mozilla.org/en-US/docs/Web/API/Element/contains)
  - [`getAttribute`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute)
  - [`getAttributeNode`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttributeNode)
  - [`getAttributeNodeNS`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttributeNodeNS)
  - [`getAttributeNS`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttributeNS)
  - [`getBoundingClientRect`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)
  - [`getClientRects`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getClientRects)
  - [`getElementsByClassName`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByClassName)
  - [`getElementsByTagName`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByTagName)
  - [`getElementsByTagNameNS`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByTagNameNS)
  - [`hasAttribute`](https://developer.mozilla.org/en-US/docs/Web/API/Element/hasAttribute)
  - [`hasAttributeNS`](https://developer.mozilla.org/en-US/docs/Web/API/Element/hasAttributeNS)
  - [`insertAdjacentElement`](https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentElement)
  - [`insertAdjacentHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML)
  - [`insertAdjacentText`](https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentText)
  - [`insertBefore`](https://developer.mozilla.org/en-US/docs/Web/API/Element/insertBefore)
  - [`matches`](https://developer.mozilla.org/en-US/docs/Web/API/Element/matches)
  - [`querySelector`](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelector)
  - [`querySelectorAll`](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll)
  - [`remove`](https://developer.mozilla.org/en-US/docs/Web/API/Element/remove)
  - [`removeAttribute`](https://developer.mozilla.org/en-US/docs/Web/API/Element/removeAttribute)
  - [`removeAttributeNode`](https://developer.mozilla.org/en-US/docs/Web/API/Element/removeAttributeNode)
  - [`removeAttributeNS`](https://developer.mozilla.org/en-US/docs/Web/API/Element/removeAttributeNS)
  - [`removeChild`](https://developer.mozilla.org/en-US/docs/Web/API/Element/removeChild)
  - [`replaceWith`](https://developer.mozilla.org/en-US/docs/Web/API/Element/replaceWith)
  - [`setAttribute`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute)
  - [`setAttributeNode`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttributeNode)
  - [`setAttributeNodeNS`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttributeNodeNS)
  - [`setAttributeNS`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttributeNS)

## React

When using LiveNodeList or LiveElement with React, you should be aware that any eventListeners or handlers attached to the live node list will remain in place after the component is unmounted. Similarly, if your selector or parent are passed into the component as props, the LiveNodeList/LiveElement will need to be recreated. To avoid this, you should use the `destroy()` method to destruct the LiveNodeList/LiveElement when components unmount.

```js
const MyComponent = ({ selector }) => {}
  const list = useRef<LiveNodeList>(null)
  const parent = useRef<LiveNodeList<HTMLElement>>(null)

  useEffect(() => {
    if (list.current) {
      list.destroy()
    }

    list.current = new LiveNodeList(selector)

    return () => {
      if (list.current) {
        list.destroy()
      }
    }
  }, [selector])

  list.current?.addEventListener('click', () => {})
}
```

To simplify this, LiveNodeList comes with two react hooks, `useLiveNodeList` and `useLiveElement`, which will handle destroying and recreating the LiveNodeList for you when necessary. Both accept the same arguments as their respective constructors.

```js
const el = useRef < HTMLElement > null
const list = useLiveNodeList('.selector', el.current)

list.addEventListener('click', () => {})
```

## Contributing

All contributions are welcome, and encouraged. Please read our [contribution guidelines](CONTRIBUTING.md) and [code of conduct](CODE-OF-CONDUCT.md) for more information.

## License

Copyright &copy; [James Dinsdale](https://molovo.co) <hi@molovo.co>

LiveNodeList is licensed under [The MIT License (MIT)](./LICENSE)

## Team

- [James Dinsdale](http://molovo.co)
