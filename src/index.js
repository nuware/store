import {
  I,
  eq,
  not,
  has,
  map,
  each,
  keys,
  join,
  tail,
  last,
  split,
  apply,
  assoc,
  equal,
  append,
  concat,
  dissoc,
  filter,
  reduce,
  flatten,
  reverse,
  compose,
  freeze
} from '@nuware/functions'

import {
  Prop,
  Get,
  Set,
  Over
} from '@nuware/lenses'

import Emitter from '@nuware/emitter'

const Store = (initialState) => {
  const PATH_SEPARATOR = '/'
  const EVENT_SEPARATOR = '://'

  const EMPTY_STATE = null

  const emitter = Emitter()

  const Path = (...args) => {
    const paths = compose(
      filter(I), split(PATH_SEPARATOR),
      join(PATH_SEPARATOR), filter(I),
      flatten
    )(args)
    const path = join(PATH_SEPARATOR)(paths)
    const lens = compose(apply(compose), map(Prop))(paths)

    return freeze({
      key: () => last(paths) || null,
      child: (...args) => compose(Path, concat(args))(paths),
      parent: () => compose(Path, reverse, tail, reverse)(paths),
      toLens: () => lens,
      toString: () => path,
      valueOf: () => paths,
      inspect: () => `Path(${path})`
    })
  }

  const Notice = (type, path, payload) => {
    const k = join(EVENT_SEPARATOR)([type, path.toString()])
    return () => emitter.emit(k)(payload)
  }

  let _state = initialState || EMPTY_STATE
  let _paths = {}

  const paths = () => _paths
  const state = () => _state

  const getIn = (path) => (st) => Get(path.toLens())(st) || EMPTY_STATE
  const setIn = (path, data) => (st) => Set(path.toLens())(data)(st)
  const removeIn = (path) => (st) => Over(path.parent().toLens())(dissoc(path.key()))(st)

  const compareState = (oldest, newest) => {
    const childsNotifications = (type, path, properties, st) => {
      return reduce((acc, property) => {
        return append(Notice(type, path, {
          ref: () => Ref(path.child(property)),
          path: path.toString(),
          key: property,
          value: getIn(Path(property))(st)
        }))(acc)
      })([])(properties)
    }

    const notices = reduce((acc, curr) => {
      const types = Get(Prop(curr))(paths())

      if (eq(0)(keys(types).length)) return acc

      const path = Path(curr)
      const oldestValue = getIn(path)(oldest)
      const newestValue = getIn(path)(newest)

      if (has(Store.CHILD_ADDED_EVENT)(types)) {
        const props = filter((k) => not(has(k)(oldestValue)))(keys(newestValue))
        acc = concat(childsNotifications(Store.CHILD_ADDED_EVENT, path, props, newestValue))(acc)
      }

      if (has(Store.CHILD_REMOVED_EVENT)(types)) {
        const props = filter((k) => not(has(k)(newestValue)))(keys(oldestValue))
        acc = concat(childsNotifications(Store.CHILD_REMOVED_EVENT, path, props, newestValue))(acc)
      }

      if (has(Store.CHILD_CHANGED_EVENT)(types)) {
        const props = compose(
          filter((k) => not(equal(Get(Prop(k))(oldestValue))(Get(Prop(k))(newestValue)))),
          filter((k) => has(k)(oldestValue))
        )(keys(newestValue))
        acc = concat(childsNotifications(Store.CHILD_CHANGED_EVENT, path, props, newestValue))(acc)
      }

      if (has(Store.VALUE_EVENT)(types) && not(equal(oldestValue)(newestValue))) {
        acc = append(Notice(Store.VALUE_EVENT, path, {
          ref: () => Ref(path),
          path: path.toString(),
          value: newestValue
        }))(acc)
      }

      return acc
    })([])(keys(paths()))

    _state = newest

    return notices
  }

  const Ref = (path) => {
    const ref = freeze({
      child: (...args) => Ref(path.child(args)),
      parent: () => Ref(path.parent()),
      get: () => getIn(path)(state()),
      set: (data) => {
        const oldest = getIn(Path())(state())
        const newest = setIn(path, data)(state())
        const notices = compareState(oldest, newest)
        return each((fn) => apply(fn)())(notices)
      },
      remove: () => {
        const oldest = getIn(Path())(state())
        const newest = removeIn(path)(state())
        const notices = compareState(oldest, newest)
        return each((fn) => apply(fn)())(notices)
      },
      off: (type, handler) => {
        const k = join(EVENT_SEPARATOR)([type, path.toString()])
        emitter.off(k)(handler)
        if (not(emitter.has(k, handler))) {
          _paths = Over(Prop(path.toString()))(dissoc(type))(paths())
        }
        return void (0)
      },
      on: (type, handler) => {
        const k = join(EVENT_SEPARATOR)([type, path.toString()])
        emitter.on(k)(handler)
        _paths = Over(Prop(path.toString()))(assoc(type)(true))(paths())

        if (eq(Store.CHILD_ADDED_EVENT)(type)) {
          const st = ref.get()
          each(property => {
            Notice(type, path, {
              ref: () => Ref(path.child(property)),
              path: path.toString(),
              key: property,
              value: getIn(Path(property))(st)
            })()
          })(keys(st))
        }

        if (eq(Store.VALUE_EVENT)(type)) {
          Notice(type, path, {
            ref: () => Ref(path),
            path: path.toString(),
            value: ref.get()
          })()
        }

        return () => ref.off(type, handler)
      },
      inspect: () => `Ref(${path.toString()})`
    })

    return ref
  }

  return freeze({
    ref: (...args) => Ref(Path(args))
  })
}

Object.defineProperty(Store, 'CHILD_ADDED_EVENT', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: 'child-added'
})

Object.defineProperty(Store, 'CHILD_CHANGED_EVENT', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: 'child-changed'
})

Object.defineProperty(Store, 'CHILD_REMOVED_EVENT', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: 'child-removed'
})

Object.defineProperty(Store, 'VALUE_EVENT', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: 'value'
})

// const VALUE_EVENT = 'value'
// const CHILD_ADDED_EVENT = 'child-added'
// const CHILD_CHANGED_EVENT = 'child-changed'
// const CHILD_REMOVED_EVENT = 'child-removed'

export default Store
