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
  constructor(selector, parent = document.documentElement, config = {}) {
    super(selector, parent, config)

    if (this.parent) {
      this.item = this.parent.querySelector(this.selector)
    }

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

    if (this.item) {
      this.item.addEventListener(event, callback)
    }

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

    if (this.item) {
      this.item.removeEventListener(event, callback)
    }

    this.events['eventListeners:remove'].forEach(callback => callback())
  }

  /**
   * Attach all event listeners to the underlying element
   *
   * @param {Element} item
   */
  @bind
  attachEventListeners (item = this.item) {
    if (!item) {
      return
    }

    if (!(item instanceof Element)) {
      throw new TypeError('item must be an instance of Element')
    }

    Object.keys(this.eventListeners).forEach(event => {
      this.eventListeners[event].forEach(callback => {
        item.addEventListener(event, callback)
      })
    })

    this.events['eventListeners:attach'].forEach(callback => callback())
  }

  /**
   * Detach all event listeners from the underlying element
   *
   * @param {Element} item
   */
  @bind
  detachEventListeners (item = this.item) {
    if (!item) {
      return
    }

    if (!(item instanceof Element)) {
      throw new TypeError('item must be an instance of Element')
    }

    Object.keys(this.eventListeners).forEach(event => {
      this.eventListeners[event].forEach(callback => {
        item.removeEventListener(event, callback)
      })
    })

    this.events['eventListeners:detach'].forEach(callback => callback())
  }

  /**
   * Refreshes the attached element
   */
  @bind
  refresh () {
    const current = this.item
    const selected = this.parent.querySelector(this.selector)

    if (current !== selected) {
      this.detachEventListeners(current)
      this.attachEventListeners(selected)

      this.item = selected

      this.events.update.forEach(callback => callback(selected, current))
    }

    if (this.item) {
      this.attachDelegatedEventListeners()
    } else {
      this.detachDelegatedEventListeners()
    }
  }
}