# LiveNodeList

An alternative to NodeList which keeps collections up to date when changes to
the DOM occur

## Install

```
npm install live-node-list
```

## Usage

Use the LiveNodeList constructor anywhere you would normally use
`Element.querySelectorAll()`.

```js
const items = new LiveNodeList('.item')
```

LiveNodeList creates a [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) instance to monitor for childList and
subtree changes within the parent, and refreshes the list of items whenever the
childList changes.

By default, LiveNodeList selects within `document.documentElement`, but you
can limit the scope of the query by passing in a parent element as a second
parameter

```js
const items = new LiveNodeList('.item', document.getElementById('my-container'))
```

LiveNodeList also maintains an internal list of event listeners, and exposes
`addEventListener()` and `removeEventListener()` methods. Adding an event
listener will cascade it to each of the items in the list, and will handle
attaching the event listener to new items when the list of items changes.

```js
const fn = () => {}
const items = new LiveNodeList('.item')
items.addEventListener('click', fn)
items.removeEventListener('click', fn)
```

LiveNodeList also triggers its own `update` event when the list of items
changes. The list of supported events may grow in future.

```js
const items = new LiveNodeList('.item')
items.on('update', (newItems, oldItems) => {
  // Do something
})
```

If your update method triggers HTML changes within the parent, you can get caught in an infinite loop, where those changes trigger the update function recursively. If this happens, you can pause and resume LiveNodeList's observation to prevent recursive calls while you make the necessary updates.

```js
const items = new LiveNodeList('.item')
items.on('update', (newItems, oldItems) => {
  items.pause()

  newItems.forEach(item => {
    // Do something which updates item's HTML
  })

  items.resume()
})
```

## LiveElement

LiveNodeList also comes with a `LiveElement` class, which is used to attach a single element, and is useful as a replacement for `document.getElementById` which provides the same API as LiveNodeList.

```js
import { LiveElement } from 'live-node-list'

const item = new LiveElement('#item')
item.addEventListener('change', fn)

item.on('update', (newItem, oldItem) => {
  // Do something
})
```
