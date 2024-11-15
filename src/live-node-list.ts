import { bind } from 'decko'
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

type InheritedMethods =
  | 'every'
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

interface LiveNodeListInterface<T extends HTMLElement>
  extends Iterable<T>,
    ArrayLike<T>,
    Pick<Array<T>, InheritedMethods> {}

export default class LiveNodeList<T extends HTMLElement = HTMLElement>
  extends Observable<T>
  implements ObservableInterface, LiveNodeListInterface<T> {
  /**
   * The list of elements
   */
  protected items: T[] = [];

  /**
   * Array index access
   */
  [n: number]: T

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
    parent: Parent | LiveElement = document.documentElement,
    config: Config = {}
  ) {
    super(selector, parent, config)

    if (this.parent) {
      this.items = Array.from(
        this.parent.querySelectorAll(this.selector) as NodeListOf<T>
      )
    } else {
      this.items = []
    }

    this.registerDOMObserver()

    return new Proxy<LiveNodeList<T>>(this, this)
  }

  /**
   * Proxy for Element.addEventListener
   */
  @bind
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
  @bind
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
  @bind
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
  @bind
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
  @bind
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

      this.items = selected
      this.events.update.forEach(
        (callback: InternalEventListenerMap<this, T>['update']) =>
          callback(newItems, oldItems)
      )
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
    return Array.prototype.filter.call(
      a,
      item => !Array.prototype.includes.call(b, item)
    ) as T[]
  }

  /**
   * Proxy for array length
   */
  get length() {
    return this.items.length
  }

  /**
   * Proxy for array index access, and array method access
   */
  get(target: LiveNodeList<T>, prop: number, receiver: any): T
  get(target: LiveNodeList<T>, prop: string | symbol, receiver: any): any
  get(
    target: LiveNodeList<T>,
    prop: keyof Array<T> | keyof typeof this | number | string | symbol,
    receiver: any
  ): T | any {
    if (typeof prop === 'number') {
      return target.items[prop]
    }

    if (Array.prototype.hasOwnProperty(prop)) {
      if (typeof Array.prototype[prop as keyof Array<T>] === 'function') {
        return Array.prototype[prop as keyof Array<T>].bind(this.items)
      }

      return this.items[prop as keyof Array<T>]
    }

    return this[prop as keyof typeof this]
  }

  /**
   * Proxy for array iteration
   */
  [Symbol.iterator](): IterableIterator<T> {
    return this.items[Symbol.iterator]()
  }

  /**======================================================================
   *
   * The following properties are proxies for Array.prototype methods.
   * Only those methods which do not modify the original array are proxied,
   * so that the contents always reflect the DOM.
   *
   ======================================================================*/
  find(
    predicate: (value: T, index: number, obj: T[]) => unknown,
    thisArg?: any
  ): T | undefined {
    return Array.prototype.find.call(this.items, predicate, thisArg)
  }

  findIndex(
    predicate: (value: T, index: number, obj: T[]) => unknown,
    thisArg?: any
  ): number {
    return Array.prototype.findIndex.call(this.items, predicate, thisArg)
  }

  every<T>(
    predicate: (value: T, index: number, array: T[]) => value is T,
    thisArg?: any
  ): this is T[] {
    return Array.prototype.every.call(this.items, predicate, thisArg)
  }

  slice(start?: number, end?: number): T[] {
    return Array.prototype.slice.call(this.items, start, end)
  }

  indexOf(searchElement: T, fromIndex?: number): number {
    return Array.prototype.indexOf.call(this.items, searchElement, fromIndex)
  }

  lastIndexOf(searchElement: T, fromIndex?: number): number {
    return Array.prototype.lastIndexOf.call(
      this.items,
      searchElement,
      fromIndex
    )
  }

  some(
    predicate: (value: T, index: number, array: T[]) => unknown,
    thisArg?: any
  ): boolean {
    return Array.prototype.some.call(this.items, predicate, thisArg)
  }

  forEach(
    callbackfn: (value: T, index: number, array: T[]) => void,
    thisArg?: any
  ): void {
    Array.prototype.forEach.call(this.items, callbackfn, thisArg)
  }

  map<U>(
    callbackfn: (value: T, index: number, array: T[]) => U,
    thisArg?: any
  ): U[] {
    return Array.prototype.map.call(this.items, callbackfn, thisArg) as U[]
  }

  filter(
    predicate: (value: T, index: number, array: T[]) => unknown,
    thisArg?: any
  ): T[] {
    return Array.prototype.filter.call(this.items, predicate, thisArg)
  }

  includes(searchElement: T, fromIndex?: number): boolean {
    return Array.prototype.includes.call(this.items, searchElement, fromIndex)
  }

  reduce<U>(
    callbackfn: (
      previousValue: U,
      currentValue: T,
      currentIndex: number,
      array: T[]
    ) => U,
    initialValue?: U
  ): U {
    return Array.prototype.reduce.call(
      this.items,
      callbackfn as (
        previousValue: unknown,
        currentValue: T,
        currentIndex: number,
        array: T[]
      ) => U,
      initialValue
    ) as U
  }

  reduceRight<U>(
    callbackfn: (
      previousValue: U,
      currentValue: T,
      currentIndex: number,
      array: T[]
    ) => U,
    initialValue?: U
  ): U {
    return Array.prototype.reduceRight.call(
      this.items,
      callbackfn as (
        previousValue: unknown,
        currentValue: T,
        currentIndex: number,
        array: T[]
      ) => U,
      initialValue
    ) as U
  }
}
