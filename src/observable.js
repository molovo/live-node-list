import { LiveElement } from './live-element'
import { bind } from 'decko'

export default class Observable {
  /**
   * A store of eventListener callbacks which will be attached to the item
   *
   * @type {object}
   */
  eventListeners = {}

  /**
   * Configuration to pass to elements observed by mutation observer
   *
   * @type {object}
   */
  observerConfig = {
    attributes: false,
    characterData: false,
    childList: true,
    subtree: true,
  }

  /**
   * The CSS selector used to collect items
   *
   * @type string
   */
  selector = ''

  /**
   * The parent element of the underlying element
   *
   * @type {HTMLElement}
   */
  parent = document.documentElement

  /**
   * List Events
   *
   * @type {object}
   */
  events = {
    update: [],
    start: [],
    pause: [],
    resume: [],
    'eventListeners:add': [],
    'eventListeners:remove': [],
    'eventListeners:attach': [],
    'eventListeners:detach': [],
    'eventListeners:purge': [],
    'delegatedEventListeners:add': [],
    'delegatedEventListeners:remove': [],
    'delegatedEventListeners:attach': [],
    'delegatedEventListeners:detach': [],
    'delegatedEventListeners:purge': []
  }

  /**
   * Delegated list events
   *
   * @type {object}
   */
  delegatedEvents = {}

  /**
   * Creates an instance of LiveElement.
   *
   * @param {string}      selector
   * @param {HTMLElement} parent
   */
  constructor(selector, parent = document.documentElement, config = {}) {
    this.selector = selector

    this.observerConfig = {
      ...this.observerConfig,
      ...config,
    }

    if (parent instanceof this.constructor) {
      this.parent = parent.item
      parent.on('update', (newItem, oldItem) => {
        this.pause()
        this.parent = newItem
        this.resume()
        this.refresh()
      })
    } else {
      this.parent = parent
    }
  }

  /**
   * Add an event listener which will apply to the LiveElement
   *
   * @param {string} event
   * @param {function} callback
   *
   * @return {LiveElement}
   */
  @bind
  on (event, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('callback must be a function')
    }

    this.events[event].push(callback)

    return this
  }

  /**
   * Remove an event listener from the LiveElement itself
   *
   * @param {string} event
   * @param {function} callback
   *
   * @return {LiveElement}
   */
  @bind
  off (event, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('callback must be a function')
    }

    if (event in this.events) {
      let i = this.events[event].indexOf(callback)
      if (i > -1) {
        this.events[event].splice(i, 1)
      }
    }

    return this
  }

  /**
   * Detach event listeners from all items, and clear the list of listeners
   */
  @bind
  purgeEventListeners () {
    this.detachEventListeners()
    this.eventListeners = {}

    this.events['eventListeners:purge'].forEach(callback => callback())
  }

  /**
   * Add an event listener to another element, which will be removed when the
   * list is empty
   *
   * @param {HTMLElement} target
   * @param {string}      event
   * @param {function}    callback
   */
  @bind
  addDelegatedEventListener (target, event, callback, options) {
    if (typeof callback !== 'function') {
      throw new TypeError('callback must be a function')
    }

    if (!(target instanceof Element || target instanceof Window || target instanceof HTMLDocument)) {
      throw new TypeError('target must be window, document or an element')
    }

    if (!(event in this.delegatedEvents)) {
      this.delegatedEvents[event] = []
    }

    this.delegatedEvents[event].push({ target, callback, options })

    if ((('items' in this) && this.items.length > 0) || (('item' in this) && this.item)) {
      target.addEventListener(event, callback, options)
    }

    this.events['delegatedEventListeners:add'].forEach(callback => callback())
  }

  /**
   * Remove a delegated event listener from another element
   *
   * @param {HTMLElement} target
   * @param {string}      event
   * @param {function}    callback
   */
  @bind
  removeDelegatedEventListener (target, event, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('callback must be a function')
    }

    if (!(target instanceof Element || target instanceof Window || target instanceof HTMLDocument)) {
      throw new TypeError('target must be window, document or an element')
    }

    this.delegatedEvents[event] = this.delegatedEvents[event].filter(item => {
      return !(item.target === target && item.callback === callback)
    })

    target.removeEventListener(event, callback)

    this.events['delegatedEventListeners:remove'].forEach(callback => callback())
  }

  /**
   * Attach all delegated event listeners
   */
  @bind
  attachDelegatedEventListeners () {
    Object.keys(this.delegatedEvents).forEach(event => {
      const defs = this.delegatedEvents[event]
      defs.forEach(def => {
        def.target.addEventListener(event, def.callback, def.options)
      })
    })

    this.events['delegatedEventListeners:attach'].forEach(callback => callback())
  }

  /**
   * Detach all delegated event listeners
   */
  @bind
  detachDelegatedEventListeners () {
    Object.keys(this.delegatedEvents).forEach(event => {
      const defs = this.delegatedEvents[event]
      defs.forEach(def => {
        def.target.removeEventListener(event, def.callback)
      })
    })

    this.events['delegatedEventListeners:detach'].forEach(callback => callback())
  }

  /**
   * Detach event listeners from all items, and clear the list of listeners
   */
  @bind
  purgeDelegatedEventListeners () {
    this.detachDelegatedEventListeners()
    this.delegatedEventListeners = {}

    this.events['delegatedEventListeners:purge'].forEach(callback => callback())
  }

  /**
   * Create a MutationObserver instance to monitor the entire DOM,
   * and refresh the element when the node tree changes
   */
  @bind
  registerDOMObserver () {
    this.observer = new MutationObserver(this.refresh)

    this.resume()

    this.events.start.forEach(callback => callback())
  }

  /**
   * Pause observation of the element's parent
   */
  @bind
  pause () {
    this.observer.disconnect()

    this.events.pause.forEach(callback => callback())
  }

  /**
   * Resume observation of the element's parent
   */
  @bind
  resume () {
    if (this.parent) {
      this.observer.observe(this.parent, this.observerConfig)
    }

    this.events.resume.forEach(callback => callback())
  }
}
