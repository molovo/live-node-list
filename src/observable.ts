import { bind } from 'decko'
import LiveElement from './live-element.js'
import {
  Config,
  DelegatedEventListener,
  DelegatedEventListenerList,
  EventListener,
  EventListenerList,
  EventName,
  InternalEventListener,
  InternalEventListenerList,
  InternalEventName,
  Parent,
} from './types.js'

export default class Observable<T extends HTMLElement> {
  /**
   * A store of eventListener callbacks which will be attached to the item
   */
  protected eventListeners: EventListenerList<EventName> = {}

  /**
   * Configuration to pass to mutation observer
   */
  protected observerConfig: Config = {
    attributes: false,
    characterData: false,
    childList: true,
    subtree: true,
  }

  /**
   * The CSS selector used to collect items
   */
  protected selector: string = ''

  /**
   * The parent element of the underlying element
   */
  protected parent?: Parent | LiveElement = document.documentElement

  /**
   * List Events
   */
  protected events: InternalEventListenerList<
    this,
    T,
    InternalEventName<this, T>
  > = {
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
    'delegatedEventListeners:purge': [],
  }

  /**
   * Delegated list events
   */
  protected delegatedEventListeners: DelegatedEventListenerList<EventName> = {}

  /**
   * The mutation observer which handles updates to the list
   */
  protected observer?: MutationObserver

  /**
   * Creates an instance of LiveElement.
   */
  constructor(
    selector: string,
    parent: Parent | LiveElement = document.documentElement,
    config: Config = {}
  ) {
    this.selector = selector

    this.observerConfig = {
      ...this.observerConfig,
      ...config,
    }

    if (
      parent instanceof LiveElement &&
      parent.constructor.name === 'LiveElement'
    ) {
      this.parent = parent.item
      parent.on(
        'update',
        (newItem?: typeof parent['item'], oldItem?: typeof parent['item']) => {
          this.pause()
          this.parent = newItem
          this.resume()
          this.refresh()
        }
      )
    } else {
      this.parent = parent
    }
  }

  @bind
  on<E extends InternalEventName<this, T>>(
    event: E,
    callback: InternalEventListener<this, T, E>
  ) {
    this.events[event].push(callback)

    return this
  }

  @bind
  off<E extends InternalEventName<this, T>>(
    event: E,
    callback: InternalEventListener<this, T, E>
  ) {
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
  purgeEventListeners() {
    this.detachEventListeners()
    this.eventListeners = {}
    this.events['eventListeners:purge'].forEach(callback => callback())
  }

  @bind
  addEventListener<E extends EventName>(
    event: E,
    listener: EventListener<E>['listener'],
    options: AddEventListenerOptions | boolean = false
  ) {
    if (!(event in this.eventListeners)) {
      this.eventListeners[event] = []
    }

    this.eventListeners[event]?.push({ listener, options })
  }

  @bind
  removeEventListener<E extends EventName>(
    event: E,
    listener: EventListener<E>['listener']
  ) {
    this.eventListeners[event] = ((this.eventListeners[event] ||
      []) as EventListener<E>[]).filter((item: EventListener<E>) => {
      return !(item.listener === listener)
    }) as EventListenerList<EventName>[E]
  }

  /**
   * Add an event listener to another element, which will be removed when the
   * list is empty
   */
  @bind
  addDelegatedEventListener<E extends EventName>(
    event: E,
    target: Document | HTMLElement | Window,
    listener: DelegatedEventListener<E>['listener'],
    options: AddEventListenerOptions
  ) {
    if (!(event in this.delegatedEventListeners)) {
      this.delegatedEventListeners[event] = []
    }

    this.delegatedEventListeners[event]?.push({ target, listener, options })

    if (!this.isEmpty) {
      target.addEventListener(
        event,
        listener as EventListenerOrEventListenerObject,
        options
      )
    }

    this.events['delegatedEventListeners:add'].forEach(callback => callback())
  }

  /**
   * Remove a delegated event listener from another element
   */
  @bind
  removeDelegatedEventListener<E extends EventName>(
    target: Document | HTMLElement | Window,
    event: E,
    listener: EventListener<E>['listener']
  ) {
    this.delegatedEventListeners[event] = ((this.delegatedEventListeners[
      event
    ] || []) as DelegatedEventListener<E>[]).filter(
      (item: DelegatedEventListener<E>) => {
        return !(item.listener === listener)
      }
    ) as DelegatedEventListenerList<EventName>[E]

    target.removeEventListener(
      event,
      listener as EventListenerOrEventListenerObject
    )
    this.events['delegatedEventListeners:remove'].forEach(callback =>
      callback()
    )
  }

  /**
   * Attach all delegated event listeners
   */
  @bind
  attachDelegatedEventListeners() {
    Object.keys(this.delegatedEventListeners).forEach(event => {
      const defs = this.delegatedEventListeners[event as EventName] || []
      defs.forEach(def => {
        def.target.addEventListener(
          event,
          def.listener as EventListenerOrEventListenerObject,
          def.options
        )
      })
    })
    this.events['delegatedEventListeners:attach'].forEach(callback =>
      callback()
    )
  }

  /**
   * Detach all delegated event listeners
   */
  @bind
  detachDelegatedEventListeners() {
    Object.keys(this.delegatedEventListeners).forEach(event => {
      const defs = this.delegatedEventListeners[event as EventName] || []
      defs.forEach(def => {
        def.target.removeEventListener(
          event,
          def.listener as EventListenerOrEventListenerObject
        )
      })
    })
    this.events['delegatedEventListeners:detach'].forEach(callback =>
      callback()
    )
  }

  /**
   * Detach event listeners from all items, and clear the list of listeners
   */
  @bind
  purgeDelegatedEventListeners() {
    this.detachDelegatedEventListeners()
    this.delegatedEventListeners = {}
    this.events['delegatedEventListeners:purge'].forEach(callback => callback())
  }

  /**
   * Create a MutationObserver instance to monitor the entire DOM,
   * and refresh the element when the node tree changes
   */
  @bind
  protected registerDOMObserver() {
    this.observer = new MutationObserver(this.refresh)

    this.resume()
    this.events.start?.forEach(callback => callback())
  }

  /**
   * Pause observation of the element's parent
   */
  @bind
  pause() {
    if (this.observer) {
      this.observer.disconnect()
    }

    this.events.pause?.forEach(callback => callback())
  }

  /**
   * Resume observation of the element's parent
   */
  @bind
  resume() {
    if (this.parent && this.observer) {
      this.observer.observe(this.parent as Node, this.observerConfig)
    }

    this.events.resume?.forEach(callback => callback())
  }

  @bind
  destroy() {
    this.pause()
    this.purgeEventListeners()
    this.purgeDelegatedEventListeners()
  }

  get isEmpty(): boolean {
    throw new Error('isEmpty accessor must be implemented')
  }

  refresh() {
    throw new Error('refresh method must be implemented')
  }

  detachEventListeners() {
    throw new Error('detachEventListeners method must be implemented')
  }

  attachEventListeners() {
    throw new Error('attachEventListeners method must be implemented')
  }
}
