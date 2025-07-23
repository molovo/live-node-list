import Observable from './observable.js'
import {
  Config,
  EventListener,
  EventListenerList,
  EventName,
  InternalEventListenerMap,
  ObservableInterface,
  Parent,
} from './types.js'

type InheritedProperties =
  | 'attributes'
  | 'childElementCount'
  | 'childNodes'
  | 'children'
  | 'clientHeight'
  | 'clientLeft'
  | 'clientTop'
  | 'clientWidth'
  | 'classList'
  | 'className'
  | 'firstElementChild'
  | 'id'
  | 'innerHTML'
  | 'innerText'
  | 'lastElementChild'
  | 'localName'
  | 'namespaceURI'
  | 'nextElementSibling'
  | 'onfullscreenchange'
  | 'onfullscreenerror'
  | 'outerHTML'
  | 'ownerDocument'
  | 'part'
  | 'prefix'
  | 'previousElementSibling'
  | 'scrollHeight'
  | 'scrollLeft'
  | 'scrollTop'
  | 'scrollWidth'
  | 'shadowRoot'
  | 'slot'
  | 'style'
  | 'tabIndex'
  | 'tagName'
  | 'textContent'

type InheritedMethods =
  | 'append'
  | 'appendChild'
  | 'closest'
  | 'cloneNode'
  | 'compareDocumentPosition'
  | 'contains'
  | 'getAttribute'
  | 'getAttributeNode'
  | 'getAttributeNodeNS'
  | 'getAttributeNS'
  | 'getBoundingClientRect'
  | 'getClientRects'
  | 'getElementsByClassName'
  | 'getElementsByTagName'
  | 'getElementsByTagNameNS'
  | 'hasAttribute'
  | 'hasAttributeNS'
  | 'insertAdjacentElement'
  | 'insertAdjacentHTML'
  | 'insertAdjacentText'
  | 'insertBefore'
  | 'matches'
  | 'querySelector'
  | 'querySelectorAll'
  | 'remove'
  | 'removeAttribute'
  | 'removeAttributeNode'
  | 'removeAttributeNS'
  | 'removeChild'
  | 'replaceWith'
  | 'setAttribute'
  | 'setAttributeNode'
  | 'setAttributeNodeNS'
  | 'setAttributeNS'

interface LiveElementInterface<T extends HTMLElement = HTMLElement>
  extends ObservableInterface,
    Pick<T, InheritedProperties & InheritedMethods> {}

export default class LiveElement<T extends HTMLElement = HTMLElement>
  extends Observable<T>
  implements LiveElementInterface<T> {
  /**
   * The underlying element
   */
  private _item: T | undefined = undefined

  /**
   * Read-only accessor for _item
   */
  get item(): T | undefined {
    return this._item
  }

  /**
   * Accessor to determine if LiveElement is populated
   */
  get isEmpty() {
    return this.item === undefined
  }

  /**
   * Creates an instance of LiveElement.
   */
  constructor(
    selector: string,
    parent: Parent | LiveElement = document.documentElement,
    config: Config = {}
  ) {
    super(selector, parent, config)

    if (this.parent) {
      this._item = (this.parent.querySelector(this.selector) as T) || undefined
    }

    this.registerDOMObserver()
  }

  /**
   * Proxy for Element.addEventListener
   */
  addEventListener<E extends EventName>(
    event: E,
    listener: EventListener<E>['listener'],
    options: boolean | AddEventListenerOptions = false
  ) {
    if (!(event in this.eventListeners)) {
      this.eventListeners[event] = []
    }

    this.eventListeners[event]?.push({ listener, options })

    if (this.item) {
      this.item.addEventListener(
        event,
        listener as EventListenerOrEventListenerObject,
        options
      )
    }

    this.events['eventListeners:add'].forEach(callback => callback())
  }

  /**
   * Proxy for Element.removeEventListener
   */
  removeEventListener<E extends EventName>(
    event: E,
    listener: EventListener<E>['listener']
  ) {
    this.eventListeners[event] = ((this.eventListeners[event] ||
      []) as EventListener<E>[]).filter(item => {
      return !(item.listener === listener)
    }) as EventListenerList<EventName>[E]

    if (this.item) {
      this.item.removeEventListener(
        event,
        listener as EventListenerOrEventListenerObject
      )
    }

    this.events['eventListeners:remove'].forEach(callback => callback())
  }

  /**
   * Attach all event listeners to the underlying element
   */
  attachEventListeners(item = this.item) {
    if (!item) {
      return
    }

    ;(Object.keys(this.eventListeners) as EventName[]).forEach(event => {
      this.eventListeners[event]?.forEach(({ listener, options }) => {
        item.addEventListener(
          event,
          listener as EventListenerOrEventListenerObject,
          options
        )
      })
    })

    this.events['eventListeners:attach'].forEach(callback => callback())
  }

  /**
   * Detach all event listeners from the underlying element
   */
  detachEventListeners(item = this.item) {
    if (!item) {
      return
    }

    ;(Object.keys(this.eventListeners) as EventName[]).forEach(event => {
      this.eventListeners[event]?.forEach(({ listener }) => {
        item.removeEventListener(
          event,
          listener as EventListenerOrEventListenerObject
        )
      })
    })

    this.events['eventListeners:detach'].forEach(callback => callback())
  }

  /**
   * Refreshes the attached element
   */
  refresh() {
    const current = this.item
    const selected =
      (this.parent?.querySelector(this.selector) as T) || undefined

    if (current !== selected) {
      this.detachEventListeners(current)
      this.attachEventListeners(selected)

      this._item = selected
      this.events.update.forEach(callback =>
        (callback as InternalEventListenerMap<this, T>['update'])(
          selected,
          current
        )
      )
    }

    if (this.item) {
      this.attachDelegatedEventListeners()
    } else {
      this.detachDelegatedEventListeners()
    }
  }

  /*====================================================================
   * The following properties and methods are inherited from the Element
   * prototype.
   *==================================================================*/
  get attributes(): NamedNodeMap {
    return this.item?.attributes || new NamedNodeMap()
  }

  get childElementCount(): number {
    return this.item?.childElementCount || 0
  }

  get childNodes(): NodeListOf<ChildNode> {
    return this.item?.childNodes || (new NodeList() as NodeListOf<ChildNode>)
  }

  get children(): HTMLCollection {
    return this.item?.children || new HTMLCollection()
  }

  get clientHeight(): number {
    return this.item?.clientHeight || 0
  }

  get clientLeft(): number {
    return this.item?.clientLeft || 0
  }

  get clientTop(): number {
    return this.item?.clientTop || 0
  }

  get clientWidth(): number {
    return this.item?.clientWidth || 0
  }

  get classList(): DOMTokenList {
    return this.item?.classList || new DOMTokenList()
  }

  get className(): string {
    return this.item?.className || ''
  }

  set className(value: string) {
    if (this.item) {
      this.item.className = value
    }
  }

  get firstElementChild(): Element | null {
    return this.item?.firstElementChild || null
  }

  get id(): string {
    return this.item?.id || ''
  }

  set id(value: string) {
    if (this.item) {
      this.item.id = value
    }
  }

  get innerHTML(): string {
    return this.item?.innerHTML || ''
  }

  set innerHTML(value: string) {
    if (this.item) {
      this.item.innerHTML = value
    }
  }

  get innerText(): string {
    if (!this.item || !(this.item instanceof Element)) {
      return ''
    }

    return this.item?.innerText || ''
  }

  set innerText(value: string) {
    if (this.item && this.item instanceof Element) {
      this.item.innerText = value
    }
  }

  get lastElementChild(): Element | null {
    return this.item?.lastElementChild || null
  }

  get localName(): string {
    return this.item?.localName || ''
  }

  get namespaceURI(): string | null {
    return this.item?.namespaceURI || null
  }

  get nextElementSibling(): Element | null {
    return this.item?.nextElementSibling || null
  }

  get onfullscreenchange(): ((this: Element, ev: Event) => any) | null {
    return this.item?.onfullscreenchange || null
  }

  set onfullscreenchange(value: ((this: Element, ev: Event) => any) | null) {
    if (this.item) {
      this.item.onfullscreenchange = value
    }
  }

  get onfullscreenerror(): ((this: Element, ev: Event) => any) | null {
    return this.item?.onfullscreenerror || null
  }

  set onfullscreenerror(value: ((this: Element, ev: Event) => any) | null) {
    if (this.item) {
      this.item.onfullscreenerror = value
    }
  }

  get outerHTML(): string {
    return this.item?.outerHTML || ''
  }

  get ownerDocument(): Document {
    return this.item?.ownerDocument || document
  }

  get part(): DOMTokenList {
    return this.item?.part || new DOMTokenList()
  }

  get prefix(): string | null {
    return this.item?.prefix || null
  }

  get previousElementSibling(): Element | null {
    return this.item?.previousElementSibling || null
  }

  get scrollHeight(): number {
    return this.item?.scrollHeight || 0
  }

  get scrollLeft(): number {
    return this.item?.scrollLeft || 0
  }

  set scrollLeft(value: number) {
    if (this.item) {
      this.item.scrollLeft = value
    }
  }

  get scrollTop(): number {
    return this.item?.scrollTop || 0
  }

  set scrollTop(value: number) {
    if (this.item) {
      this.item.scrollTop = value
    }
  }

  get scrollWidth(): number {
    return this.item?.scrollWidth || 0
  }

  get shadowRoot(): ShadowRoot | null {
    return this.item?.shadowRoot || null
  }

  get slot(): string {
    return this.item?.slot || ''
  }

  set slot(value: string) {
    if (this.item) {
      this.item.slot = value
    }
  }

  get style(): CSSStyleDeclaration {
    if (!this.item || !(this.item instanceof HTMLElement)) {
      return new CSSStyleDeclaration()
    }
    return this.item.style
  }

  get tabIndex(): number {
    return this.item?.tabIndex || 0
  }

  set tabIndex(value: number) {
    if (this.item) {
      this.item.tabIndex = value
    }
  }

  get tagName(): string {
    return this.item?.tagName || ''
  }

  get textContent(): string {
    return this.item?.textContent || ''
  }

  set textContent(value: string) {
    if (this.item) {
      this.item.textContent = value
    }
  }

  append(...nodes: (Node | string)[]): void {
    this.item?.append(...nodes)
  }

  appendChild<T extends Node>(node: T): T
  appendChild<T extends Node>(node: T): T | undefined {
    return this.item?.appendChild(node) || undefined
  }

  closest(selector: string): Element | null {
    return this.item?.closest(selector) || null
  }

  cloneNode(deep?: boolean): Node
  cloneNode(deep?: boolean): Node | undefined {
    return this.item?.cloneNode(deep) || undefined
  }

  compareDocumentPosition(other: Node): number {
    return this.item?.compareDocumentPosition(other) || 0
  }

  contains(other: Node | null): boolean {
    return this.item?.contains(other) || false
  }

  getAttribute(qualifiedName: string): string | null {
    return this.item?.getAttribute(qualifiedName) || null
  }

  getAttributeNode(qualifiedName: string): Attr | null {
    return this.item?.getAttributeNode(qualifiedName) || null
  }

  getAttributeNodeNS(namespace: string | null, localName: string): Attr | null {
    return this.item?.getAttributeNodeNS(namespace, localName) || null
  }

  getAttributeNS(namespace: string | null, localName: string): string | null {
    return this.item?.getAttributeNS(namespace, localName) || null
  }

  getBoundingClientRect(): DOMRect
  getBoundingClientRect(): DOMRect | undefined {
    return this.item?.getBoundingClientRect() || undefined
  }

  getClientRects(): DOMRectList
  getClientRects(): DOMRectList | undefined {
    return this.item?.getClientRects() || undefined
  }

  getElementsByClassName(classNames: string): HTMLCollectionOf<Element> {
    return (
      this.item?.getElementsByClassName(classNames) ||
      (new HTMLCollection() as HTMLCollectionOf<Element>)
    )
  }

  getElementsByTagName(qualifiedName: string): HTMLCollectionOf<Element> {
    return (
      this.item?.getElementsByTagName(qualifiedName) ||
      (new HTMLCollection() as HTMLCollectionOf<Element>)
    )
  }

  getElementsByTagNameNS(
    namespaceURI: 'http://www.w3.org/1999/xhtml',
    localName: string
  ): HTMLCollectionOf<HTMLElement>
  getElementsByTagNameNS(
    namespaceURI: 'http://www.w3.org/2000/svg',
    localName: string
  ): HTMLCollectionOf<SVGElement>
  getElementsByTagNameNS(
    namespaceURI: 'http://www.w3.org/1998/Math/MathML',
    localName: string
  ): HTMLCollectionOf<MathMLElement>
  getElementsByTagNameNS(
    namespace: string | null,
    localName: string
  ): HTMLCollectionOf<Element> {
    return (
      this.item?.getElementsByTagNameNS(namespace, localName) ||
      (new HTMLCollection() as HTMLCollectionOf<Element>)
    )
  }

  hasAttribute(qualifiedName: string): boolean {
    return this.item?.hasAttribute(qualifiedName) || false
  }

  hasAttributeNS(namespace: string | null, localName: string): boolean {
    return this.item?.hasAttributeNS(namespace, localName) || false
  }

  insertAdjacentElement(
    position: InsertPosition,
    insertedElement: Element
  ): Element | null {
    return this.item?.insertAdjacentElement(position, insertedElement) || null
  }

  insertAdjacentHTML(where: InsertPosition, html: string): void {
    this.item?.insertAdjacentHTML(where, html)
  }

  insertAdjacentText(where: InsertPosition, text: string): void {
    this.item?.insertAdjacentText(where, text)
  }

  insertBefore<T extends Node>(node: T, child: Node | null): T
  insertBefore<T extends Node>(node: T, child: Node | null): T | undefined {
    return this.item?.insertBefore(node, child)
  }

  matches(selectors: string): boolean {
    return this.item?.matches(selectors) || false
  }

  querySelector(selector: string): Element | null {
    return this.item?.querySelector(selector) || null
  }

  querySelectorAll(selector: string): NodeListOf<Element> {
    return this.item?.querySelectorAll(selector)!
  }

  remove(): void {
    this.item?.remove()
  }

  removeAttribute(qualifiedName: string): void {
    this.item?.removeAttribute(qualifiedName)
  }

  removeAttributeNode(attr: Attr): Attr
  removeAttributeNode(attr: Attr): Attr | undefined {
    return this.item?.removeAttributeNode(attr) || undefined
  }

  removeAttributeNS(namespace: string | null, localName: string): void {
    this.item?.removeAttributeNS(namespace, localName)
  }

  removeChild<T extends Node>(child: T): T
  removeChild<T extends Node>(child: T): T | undefined {
    return this.item?.removeChild(child) || undefined
  }

  replaceWith(...nodes: (Node | string)[]): void {
    this.item?.replaceWith(...nodes)
  }

  setAttribute(qualifiedName: string, value: string): void {
    this.item?.setAttribute(qualifiedName, value)
  }

  setAttributeNode(attr: Attr): Attr | null {
    return this.item?.setAttributeNode(attr) || null
  }

  setAttributeNodeNS(attr: Attr): Attr | null {
    return this.item?.setAttributeNodeNS(attr) || null
  }

  setAttributeNS(
    namespace: string | null,
    qualifiedName: string,
    value: string
  ): void {
    this.item?.setAttributeNS(namespace, qualifiedName, value)
  }
}
