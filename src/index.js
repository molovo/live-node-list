import { bind, debounce } from 'decko'

class LiveNodeList {
  /**
   * A store of eventListener callbacks which are attached to each item in the
   * collection
   */
  eventListeners = {}

  /**
   * The CSS selector used to collect items
   *
   * @type {string}
   */
  selector = ''

  /**
   * The parent element of the underlying NodeList
   *
   * @type {HTMLElement}
   */
  parent = document.documentElement

  /**
   * The list of items
   *
   * @type {NodeList}
   */
  items = null

  /**
   * List Events
   *
   * @type {object}
   */
  listEvents = {
    update: []
  }

  /**
   * Creates an instance of LiveNodeList.
   *
   * @param {string}      selector
   * @param {HTMLElement} parent
   */
  constructor (selector, parent = document.documentElement) {
    this.selector = selector
    this.parent = parent

    this.items = this.parent.querySelectorAll(this.selector)

    this.registerDOMObserver()
  }

  /**
   * @return {int}
   */
  get length () {
    return this.items.length
  }

  /**
   * Add an event listener which will apply to the LiveNodeList itself
   *
   * @param {string} event
   * @param {function} callback
   *
   * @return {LiveNodeList}
   */
  @bind
  on (event, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('callback must be a function')
    }

    this.listEvents[event].push(callback)

    return this
  }

  /**
   * Remove an event listener from the LiveNodeList itself
   *
   * @param {string} event
   * @param {function} callback
   *
   * @return {LiveNodeList}
   */
  @bind
  off (event, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('callback must be a function')
    }

    if (event in this.listEvents) {
      let i = this.listEvents[event].indexOf(callback)
      if (i > -1) {
        this.listEvents[event].splice(i, 1)
      }
    }

    return this
  }

  /**
   * Proxy for NodeList.forEach
   *
   * @param {function} callback
   * @param {any}      thisArg
   *
   * @return {void}
   */
  @bind
  forEach (callback, thisArg) {
    return this.items.forEach(callback, thisArg)
  }

  /**
   * Proxy for Array.map
   *
   * @param {function} callback
   *
   * @return {Array}
   */
  @bind
  map (callback) {
    return Array.prototype.map.call(this.items, callback)
  }

  /**
   * Proxy for Element.addEventListener
   *
   * @param {string}   event
   * @param {function} callback
   * @param {boolean}  passive
   */
  @bind
  addEventListener (event, callback, passive = false) {
    if (!(event in this.eventListeners)) {
      this.eventListeners[event] = []
    }

    this.eventListeners[event].push(callback)

    this.items.forEach(item => {
      item.addEventListener(event, callback)
    })
  }

  /**
   * Proxy for Element.removeEventListener
   *
   * @param {string}   event
   * @param {function} callback
   */
  @bind
  removeEventListener (event, callback) {
    if (event in this.eventListeners) {
      let i = this.eventListeners[event].indexOf(callback)
      if (i > -1) {
        this.eventListeners[event].splice(i, 1)
      }
    }

    this.items.forEach(item => {
      item.removeEventListener(event, callback)
    })
  }

  /**
   * Attach all event listeners to a list of items (or all items by default)
   *
   * @param {Array|NodeList} items
   */
  @bind
  attachEventListeners (items = this.items) {
    if (!(Array.isArray(items) || items instanceof NodeList)) {
      throw new TypeError('items must be an instance of Array or NodeList')
    }

    Object.keys(this.eventListeners).forEach(event => {
      this.eventListeners[event].forEach(callback => {
        items.forEach(item => {
          item.addEventListener(event, callback)
        })
      })
    })
  }

  /**
   * Detach all event listeners from a list of items (or all items by default)
   *
   * @param {Array|NodeList} items
   */
  @bind
  detachEventListeners (items = this.items) {
    if (!(Array.isArray(items) || items instanceof NodeList)) {
      throw new TypeError('items must be an instance of Array or NodeList')
    }

    Object.keys(this.eventListeners).forEach(event => {
      this.eventListeners[event].forEach(callback => {
        items.forEach(item => {
          item.removeEventListener(event, callback)
        })
      })
    })
  }

  /**
   * Detach event listeners from all items, and clear the list of listeners
   */
  @bind
  purgeEventListeners () {
    this.detachEventListeners()
    this.eventListeners = {}
  }

  /**
   * Refreshes the list of attached elements
   */
  @bind
  refresh () {
    const current = this.items
    const selected = this.parent.querySelectorAll(this.selector)

    const newItems = this.diffNodeList(selected, current)
    const oldItems = this.diffNodeList(current, selected)

    this.detachEventListeners(oldItems)
    this.attachEventListeners(newItems)

    this.listEvents.update.forEach(callback => callback(newItems, oldItems))

    this.items = selected
  }

  /**
   * Create a MutationObserver instance to monitor the entire DOM,
   * and refresh the list of items when the node tree changes
   */
  @bind
  registerDOMObserver () {
    this.observer = new MutationObserver(this.refresh)
    this.resume()
  }

  /**
   * Return an array containing the items in NodeList a which are not present
   * in NodeList b
   *
   * @param {Array|NodeList} a
   * @param {Array|NodeList} b
   *
   * @return {Array}
   */
  diffNodeList (a, b) {
    return Array.prototype.filter.call(a, item => Array.prototype.includes.call(b, item))
  }

  /**
   * Pause observation of the list's parent
   */
  @bind
  pause () {
    this.observer.disconnect()
  }

  /**
   * Resume observation of the list's parent
   */
  @bind
  resume () {
    this.observer.observe(this.parent, {
      childList: true,
      subtree: true
    })
  }
}

export default LiveNodeList
