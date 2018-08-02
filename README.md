# LiveNodeList

An alternative to NodeList which keeps collections up to date when changes to
the DOM occur

## Install

```
npm install live-node-list
```

## Usage

Use the LiveNodeList constructor anywhere you would normally use
`document.querySelectorAll()`.

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

