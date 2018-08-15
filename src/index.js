import {
  I,
  eq,
  ne,
  not,
  assoc,
  dissoc,
  prop,
  concat,
  append,
  reverse,
  tail,
  last,
  has,
  keys,
  filter,
  find,
  sort,
  each,
  map,
  reduce,
  join,
  split,
  apply,
  compose,
  freeze,
  match,
  isNull,
  isDefined,
  isObject
} from '@nuware/functions'

import {
  Prop,
  Get,
  Set,
  Over
} from '@nuware/lenses'

import Emitter from '@nuware/emitter'

const Store = (initialState = {}, {
  separator = '/'
} = {}) => {
  let state = Object.assign({}, initialState)
  const emitter  = Emitter()

  const EventsLens = Prop('events')
  const ValueLens = Prop('value')
  const PathLens = Prop('path')

  const pathToArray = (path) => filter(I)(split(separator)(path))
  const arrayToPath = (xs) => join(separator)(filter(I)(xs))
  const makeLens = (path = '') => apply(compose)(map(Prop)(pathToArray(path)))

  const VALUE_EVENT         = 'value'
  const CHILD_ADDED_EVENT   = 'child-added'
  const CHILD_CHANGED_EVENT = 'child-changed'
  const CHILD_REMOVED_EVENT = 'child-removed'

  const get = (path) => freeze(Get(makeLens(path))(state) || null)

  const onChilds = (ref) => {
    const childs = reduce((acc, key) =>
      concat(onChilds(ref.child(key)))(acc)
    )([])(keys(ref.value()))
    return compose(
      append({
        type: VALUE_EVENT,
        path: ref.path,
        value: ref.value
      }),
      append({
        type: CHILD_REMOVED_EVENT,
        path: ref.origin,
        key: ref.key,
        value: ref.value
      })
    )(childs)
  }

  const del = (path) => {
    const ref = Ref(path)

    const parent = get(ref.origin)
    if (not(has(ref.key)(parent))) { return [] }
    if (isObject(parent) && eq(0)(keys(parent).length)) { return del(ref.origin) }

    const value = dissoc(ref.key)(parent)
    if (isObject(value) && eq(0)(keys(value).length) && ne('')(ref.origin)) { return del(ref.origin) }

    const events = onChilds(ref)
    state = Set(makeLens(ref.origin))(value)(state)
    return events
  }

  const set = (path, value) => {
    const ref = Ref(path)

    if (isNull(value)) {
      return eq('')(ref.path)
        ? reduce((acc, key) => concat(del(ref.child(key).path))(acc))([])(keys(ref.value()))
        : del(ref.path)
    }

    if (isObject(value)) {
      if (eq(0)(keys(value).length)) { return del(ref.path) }

      const keysForUpdate = keys(value)
      const keysForDelete = filter((key) => not(find(eq(key))(keysForUpdate)))(keys(ref.value()))

      const deletes = reduce((acc, key) => concat(del(ref.child(key).path))(acc))([])(keysForDelete)
      const updates = reduce((acc, key) => concat(set(ref.child(key).path, prop(key)(value)))(acc))([])(keysForUpdate)

      return concat(deletes)(updates)
    }

    const events = ne(ref.value())(value)
      ? Get(EventsLens)(reduce((acc, k) => {
        const p = append(k)(Get(PathLens)(acc))
        const v = Get(ValueLens)(acc)
        const r = Ref(arrayToPath(p))

        return compose(
          Set(ValueLens)(r.value()),
          Set(PathLens)(p),
          Over(EventsLens)(compose(
            append({
              type: VALUE_EVENT,
              path: r.path,
              value: r.value
            }),
            append({
              type: has(k)(v) ? CHILD_CHANGED_EVENT : CHILD_ADDED_EVENT,
              path: r.origin,
              key: r.key,
              value: r.value
            })
          ))
        )(acc)
      })({
        path: [],
        events: [],
        value: state
      })(pathToArray(ref.path)))
      : []

    state = Set(makeLens(ref.path))(value)(state)

    return events
  }

  const emit = (groups) => {
    const emitterState = emitter.state()
    each((type) => {
      each((event) => {
        const key = join('://')([event.type, event.path])
        has(key)(emitterState) && emitter.emit(key)(compose(
          freeze,
          assoc('value')(event.value()),
          assoc('path')(event.path),
          has('key')(event) ? assoc('key')(event.key) : I
        )({}))
      })(prop(type)(groups) || [])
    })([CHILD_REMOVED_EVENT, CHILD_ADDED_EVENT, CHILD_CHANGED_EVENT, VALUE_EVENT])
    return void (0)
  }

  const groupEvents = (events) => {
    return reduce((acc, ev) => Over(Prop(ev.type))((es = []) =>
      (eq(VALUE_EVENT)(ev.type) || eq(CHILD_CHANGED_EVENT)(ev.type))
        ? find((e) => eq(ev.path)(e.path))(es) ? es : append(ev)(es)
        : append(ev)(es)
    )(acc)
    )({})(events)
  }

  const sortGroups = (groups) => {
    const Desc = (a, b) => eq(a.path)(b.path) ? 0 : (a.path > b.path) ? -1 : 1
    const Asc = (a, b) => eq(a.path)(b.path) ? 0 : (a.path < b.path) ? -1 : 1

    return reduce((acc, key) => {
      const events = prop(key)(groups) || []
      const sortType = match(key)
        .on(eq(VALUE_EVENT), () => Desc)
        .on(eq(CHILD_ADDED_EVENT), () => Asc)
        .on(eq(CHILD_CHANGED_EVENT), () => Desc)
        .on(eq(CHILD_REMOVED_EVENT), () => Desc)
        .otherwise(() => Desc)
      return assoc(key)(sort(sortType)(events))(acc)
    })({})(keys(groups))
  }

  const Ref = (path = '') => {
    const xs = pathToArray(path)
    const key = last(xs) || ''
    const origin = arrayToPath(compose(reverse, tail, reverse)(xs))

    const instance = freeze({
      key,
      origin,
      path: arrayToPath(xs),
      child: (path) => Ref(arrayToPath(concat(pathToArray(path))(xs))),
      value: (value) => isDefined(value) ? compose(emit, sortGroups, groupEvents)(set(instance.path, value)) : get(instance.path),
      remove: () => instance.value(null),
      on: (type) => (handler) => emitter.on(join('://')([type, path]))(handler),
      off: (type) => (handler) => emitter.off(join('://')([type, path]))(handler)
    })

    return instance
  }

  return {
    ref: (path) => Ref(path)
  }
}

export default Store
