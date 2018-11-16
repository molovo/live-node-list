import { bind } from 'decko'

export default class Observable {
  /**
   * A store of eventListener callbacks which will be attached to the item
   *
   * @type {object}
   */
  eventListeners = {}

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
    'eventListeners:purge': []
  }

  /**
   * Creates an instance of LiveElement.
   *
   * @param {string}      selector
   * @param {HTMLElement} parent
   */
  constructor (selector, parent = document.documentElement) {
    this.selector = selector
    this.parent = parent
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
   * Create a MutationObserver instance to monitor the entire DOM,
   * and refresh the element when the node tree changes
   */
  @bind
  registerDOMObserver () {
    this.observer = new MutationObserver(this.refresh)

    if (this.parent) {
      this.observer.observe(this.parent, {
        attributes: false,
        characterData: false,
        childList: true,
        subtree: true
      })
    }

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
      this.observer.observe(this.parent, {
        attributes: false,
        characterData: false,
        childList: true,
        subtree: true
      })
    }

    this.events.resume.forEach(callback => callback())

    // Since observation had been disabled, force a refresh now to ensure the
    // list is up to date
    this.refresh()
  }
}
