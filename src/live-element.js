import { bind } from 'decko'
import Observable from './observable'

export default class LiveElement extends Observable {
  /**
   * The underlying element
   *
   * @type {HTMLElement}
   */
  item = null

  /**
   * Creates an instance of LiveElement.
   *
   * @param {string}      selector
   * @param {HTMLElement} parent
   */
  constructor (selector, parent = document.documentElement) {
    super(selector, parent)

    this.items = this.parent.querySelector(this.selector)

    this.registerDOMObserver()
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

    this.item.addEventListener(event, callback)
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

    this.item.removeEventListener(event, callback)
  }

  /**
   * Attach all event listeners to the underlying element
   *
   * @param {Element} item
   */
  @bind
  attachEventListeners (item = this.item) {
    if (!(item instanceof Element)) {
      throw new TypeError('item must be an instance of Element')
    }

    Object.keys(this.eventListeners).forEach(event => {
      this.eventListeners[event].forEach(callback => {
        item.addEventListener(event, callback)
      })
    })
  }

  /**
   * Detach all event listeners from the underlying element
   *
   * @param {Element} item
   */
  @bind
  detachEventListeners (item = this.item) {
    if (!(item instanceof Element)) {
      throw new TypeError('item must be an instance of Element')
    }

    Object.keys(this.eventListeners).forEach(event => {
      this.eventListeners[event].forEach(callback => {
        item.removeEventListener(event, callback)
      })
    })
  }

  /**
   * Refreshes the attached element
   */
  @bind
  refresh () {
    const current = this.item
    const selected = this.parent.querySelector(this.selector)

    this.detachEventListeners(current)
    this.attachEventListeners(selected)

    this.events.update.forEach(callback => callback(selected, current))

    this.item = selected
  }
}
