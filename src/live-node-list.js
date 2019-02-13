import { bind } from 'decko'
import Observable from './observable'

export default class LiveNodeList extends Observable {
  /**
   * The list of items
   *
   * @type {NodeList}
   */
  items = null

  /**
   * Creates an instance of LiveNodeList.
   *
   * @param {string}      selector
   * @param {HTMLElement} parent
   */
  constructor (selector, parent = document.documentElement) {
    super(selector, parent)

    if (this.parent) {
      this.items = this.parent.querySelectorAll(this.selector)
    } else {
      this.items = []
    }

    this.registerDOMObserver()
  }

  /**
   * @return {int}
   */
  get length () {
    return this.items.length
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

    this.events['eventListeners:add'].forEach(callback => callback())
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

    this.events['eventListeners:remove'].forEach(callback => callback())
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

    this.events['eventListeners:attach'].forEach(callback => callback())
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

    this.events['eventListeners:detach'].forEach(callback => callback())
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

    if ((newItems.length > 0) || (oldItems.length > 0)) {
      this.detachEventListeners(oldItems)
      this.attachEventListeners(newItems)

      this.items = selected

      this.events.update.forEach(callback => callback(newItems, oldItems))
    }

    if (this.items.length > 0) {
      this.attachDelegatedEventListeners()
    } else {
      this.detachDelegatedEventListeners()
    }
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
    return Array.prototype.filter.call(a, item => !Array.prototype.includes.call(b, item))
  }
}
