import type LiveElement from './live-element.js'
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

export default abstract class Observable<T extends HTMLElement> {
  abstract get isEmpty(): boolean
  protected abstract refresh(): void
  abstract detachEventListeners(): void
  abstract attachEventListeners(): void

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
  protected _parent?: Parent | LiveElement =
    typeof document !== 'undefined' ? document.documentElement : undefined

  get parent(): Parent | undefined {
    if (this._parent && 'item' in this._parent) {
      return (this._parent as LiveElement<HTMLElement>).item
    }

    return this._parent as Parent
  }

  set parent(parent: Parent | LiveElement) {
    this._parent = parent

    if (this._parent && 'item' in this._parent) {
      ;(this._parent as LiveElement<HTMLElement>).on(
        'update',
        (newItem?: HTMLElement) => {
          this.refresh()
        }
      )
    }
  }

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
    parent: Parent | LiveElement = typeof document !== 'undefined'
      ? document.documentElement
      : (undefined as any),
    config: Config = {}
  ) {
    this.selector = selector

    this.observerConfig = {
      ...this.observerConfig,
      ...config,
    }

    this.parent = parent
  }

  on<E extends InternalEventName<this, T>>(
    event: E,
    callback: InternalEventListener<this, T, E>
  ) {
    this.events[event].push(callback)

    return this
  }

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
  purgeEventListeners() {
    this.detachEventListeners()
    this.eventListeners = {}
    this.events['eventListeners:purge'].forEach(callback => callback())
  }

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
  addDelegatedEventListener<E extends EventName>(
    target: Document | HTMLElement | Window,
    event: E,
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

  /*
   * Attach all delegated event listeners
   */
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
  purgeDelegatedEventListeners() {
    this.detachDelegatedEventListeners()
    this.delegatedEventListeners = {}
    this.events['delegatedEventListeners:purge'].forEach(callback => callback())
  }

  /**
   * Create a MutationObserver instance to monitor the entire DOM,
   * and refresh the element when the node tree changes
   */
  protected registerDOMObserver() {
    // Explicitly bind 'refresh' to this to avoid context issues
    this.observer = new MutationObserver(() => this.refresh())

    this.resume()
    this.events.start?.forEach(callback => callback())
  }

  /**
   * Pause observation of the element's parent
   */
  pause() {
    if (this.observer) {
      this.observer.disconnect()
    }

    this.events.pause?.forEach(callback => callback())
  }

  /**
   * Resume observation of the element's parent
   */
  resume() {
    if (this.parent && this.observer) {
      this.observer.observe(this.parent as Node, this.observerConfig)
    }

    this.events.resume?.forEach(callback => callback())
  }

  destroy() {
    this.pause()
    this.purgeEventListeners()
    this.purgeDelegatedEventListeners()
  }
}
