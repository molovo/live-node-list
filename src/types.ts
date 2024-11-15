import LiveNodeList from './live-node-list.js'
import Observable from './observable.js'

export interface ObservableInterface {
  get isEmpty(): boolean
  refresh(): void
  detachEventListeners(): void
  attachEventListeners(): void
}

export interface Config extends MutationObserverInit {}

export type EventName = keyof GlobalEventHandlersEventMap

export type EventListener<E extends EventName> = {
  listener: (event: GlobalEventHandlersEventMap[E]) => void | boolean
  options?: boolean | AddEventListenerOptions
}

export type EventListenerList<E extends EventName> = {
  [P in E]?: EventListener<P>[]
}

export type DelegatedEventListener<E extends EventName> = {
  target: Document | HTMLElement | Window
  listener: (event: GlobalEventHandlersEventMap[E]) => void | boolean
  options?: AddEventListenerOptions | boolean
}

export type DelegatedEventListenerList<E extends EventName> = {
  [P in E]?: DelegatedEventListener<P>[]
}

export type Parent = Document | Element

export interface InternalEventListenerMap<
  B extends Observable<T>,
  T extends HTMLElement
> {
  update: B extends LiveNodeList<T>
    ? (newItems: T[], oldItems: T[]) => void
    : (newItem?: T, oldItem?: T) => void
  start: () => void
  pause: () => void
  resume: () => void
  'eventListeners:add': () => void
  'eventListeners:remove': () => void
  'eventListeners:attach': () => void
  'eventListeners:detach': () => void
  'eventListeners:purge': () => void
  'delegatedEventListeners:add': () => void
  'delegatedEventListeners:remove': () => void
  'delegatedEventListeners:attach': () => void
  'delegatedEventListeners:detach': () => void
  'delegatedEventListeners:purge': () => void
}

export type InternalEventName<
  B extends Observable<T>,
  T extends HTMLElement
> = keyof InternalEventListenerMap<B, T>

export type InternalEventListenerList<
  B extends Observable<T>,
  T extends HTMLElement,
  E extends InternalEventName<B, T>
> = {
  [P in E]: InternalEventListenerMap<B, T>[P][]
}

export type InternalEventListener<
  B extends Observable<T>,
  T extends HTMLElement,
  E extends InternalEventName<B, T>
> = InternalEventListenerMap<B, T>[E]
