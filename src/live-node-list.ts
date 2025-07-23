import LiveElement from './live-element.js'
import Observable from './observable.js'
import {
  Config,
  EventListener,
  EventName,
  InternalEventListenerMap,
  ObservableInterface,
  Parent,
} from './types.js'

type InheritedProperties = 'length'

type InheritedMethods =
  | 'every'
  | 'filter'
  | 'find'
  | 'findIndex'
  | 'forEach'
  | 'includes'
  | 'indexOf'
  | 'lastIndexOf'
  | 'map'
  | 'reduce'
  | 'reduceRight'
  | 'slice'
  | 'some'

interface LiveNodeListInterface<T extends HTMLElement = HTMLElement>
  extends ObservableInterface,
    Iterable<T>,
    Pick<Array<T>, InheritedProperties & InheritedMethods> {}

export default class LiveNodeList<T extends HTMLElement = HTMLElement>
  extends Observable<T>
  implements LiveNodeListInterface<T> {
  /**
   * The list of elements
   */
  private _items: T[] = []

  /**
   * Read-only accessor for _items
   */
  get items(): T[] {
    return this._items
  }

  /**
   * Proxy for array length
   */
  get length() {
    return this.items.length
  }

  /**
   * Proxy for array iteration
   */
  [Symbol.iterator](): IterableIterator<T> {
    return this.items[Symbol.iterator]()
  }

  /**
   * Accessor to determine if LiveElement is populated
   */
  get isEmpty() {
    return !this.items || this.items.length === 0
  }

  /**
   * Creates an instance of LiveNodeList
   */
  constructor(
    selector: string,
    parent: Parent | LiveElement = typeof document !== 'undefined'
      ? document.documentElement
      : (undefined as any),
    config: Config = {}
  ) {
    super(selector, parent, config)

    if (this.parent) {
      this._items = Array.from(
        this.parent.querySelectorAll(this.selector) as NodeListOf<T>
      )
    } else {
      this._items = []
    }

    this.registerDOMObserver()
  }

  /**
   * Proxy for Element.addEventListener
   */
  addEventListener<E extends EventName>(
    event: E,
    listener: EventListener<E>['listener'],
    options: AddEventListenerOptions | boolean = false
  ) {
    super.addEventListener(event, listener, options)

    this.items.forEach(item => {
      item.addEventListener(
        event,
        listener as EventListenerOrEventListenerObject,
        options
      )
    })

    this.events['eventListeners:add'].forEach(callback => callback())
  }

  /**
   * Proxy for Element.removeEventListener
   */
  removeEventListener<E extends EventName>(
    event: E,
    listener: EventListener<E>['listener']
  ) {
    super.removeEventListener(event, listener)

    this.items.forEach(item => {
      item.removeEventListener(
        event,
        listener as EventListenerOrEventListenerObject
      )
    })

    this.events['eventListeners:remove'].forEach(callback => callback())
  }

  /**
   * Attach all event listeners to a list of items (or all items by default)
   */
  attachEventListeners(items = this.items) {
    ;(Object.keys(this.eventListeners) as EventName[]).forEach(event => {
      this.eventListeners[event]?.forEach(({ listener, options }) => {
        items.forEach(item => {
          item.addEventListener(
            event,
            listener as EventListenerOrEventListenerObject,
            options
          )
        })
      })
    })

    this.events['eventListeners:attach'].forEach(callback => callback())
  }

  /**
   * Detach all event listeners from a list of items (or all items by default)
   */
  detachEventListeners(items = this.items) {
    ;(Object.keys(this.eventListeners) as EventName[]).forEach(event => {
      this.eventListeners[event]?.forEach(({ listener }) => {
        items.forEach(item => {
          item.removeEventListener(
            event,
            listener as EventListenerOrEventListenerObject
          )
        })
      })
    })

    this.events[
      'eventListeners:detach'
    ].forEach(
      (callback: InternalEventListenerMap<this, T>['eventListeners:detach']) =>
        callback()
    )
  }

  /**
   * Refreshes the list of attached elements
   */
  refresh() {
    const current = this.items as T[]
    const selected = Array.from(
      this.parent?.querySelectorAll(this.selector) || []
    ) as T[]

    const newItems = this.diffNodeList(selected, current)
    const oldItems = this.diffNodeList(current, selected)

    if (newItems.length > 0 || oldItems.length > 0) {
      this.detachEventListeners(oldItems)
      this.attachEventListeners(newItems)

      this._items = selected

      this.pause()
      this.events.update.forEach(
        (callback: InternalEventListenerMap<this, T>['update']) =>
          callback(newItems, oldItems)
      )
      this.resume()
    }

    if (this.isEmpty) {
      this.detachDelegatedEventListeners()
    } else {
      this.attachDelegatedEventListeners()
    }
  }

  /**
   * Return an array containing the items in NodeList a which are not present
   * in NodeList b
   */
  diffNodeList(a: T[], b: T[]): T[] {
    return a.filter((item: T) => !b.includes(item))
  }

  /**======================================================================
   *
   * The following properties are proxies for Array.prototype methods.
   * Only those methods which do not modify the original array are proxied,
   * so that the contents always reflect the DOM.
   *
   ======================================================================*/
  every(
    predicate: (value: T, index: number, array: T[]) => boolean,
    thisArg?: any
  ): boolean {
    return this.items.every(predicate, thisArg)
  }

  filter(
    callback: (value: T, index: number, array: T[]) => boolean,
    thisArg?: any
  ) {
    return this.items.filter(callback, thisArg)
  }

  find(
    callback: (value: T, index: number, array: T[]) => boolean,
    thisArg?: any
  ) {
    return this.items.find(callback, thisArg)
  }

  findIndex(
    callback: (value: T, index: number, array: T[]) => boolean,
    thisArg?: any
  ) {
    return this.items.findIndex(callback, thisArg)
  }

  forEach(
    callback: (value: T, index: number, array: T[]) => void,
    thisArg?: any
  ) {
    return this.items.forEach(callback, thisArg)
  }

  includes(value: T, fromIndex?: number) {
    return this.items.includes(value, fromIndex)
  }

  indexOf(value: T, fromIndex?: number) {
    return this.items.indexOf(value, fromIndex)
  }

  lastIndexOf(value: T, fromIndex?: number) {
    return this.items.lastIndexOf(value, fromIndex)
  }

  map(callback: (value: T, index: number, array: T[]) => any, thisArg?: any) {
    return this.items.map(callback, thisArg)
  }

  reduce(
    callback: (accumulator: any, value: T, index: number, array: T[]) => any,
    initialValue?: any
  ) {
    return this.items.reduce(callback, initialValue)
  }

  reduceRight(
    callback: (accumulator: any, value: T, index: number, array: T[]) => any,
    initialValue?: any
  ) {
    return this.items.reduceRight(callback, initialValue)
  }

  slice(start?: number, end?: number) {
    return this.items.slice(start, end)
  }

  some(
    callback: (value: T, index: number, array: T[]) => boolean,
    thisArg?: any
  ) {
    return this.items.some(callback, thisArg)
  }
}
