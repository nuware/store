import {
  eq,
  ne,
  not,
  reverse,
  split,
  last,
  tail,
  join,
  dissoc,
  keys,
  prepend,
  append,
  concat,
  each,
  map,
  reduce,
  find,
  apply,
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

const Store = (initialState = {}, {
  separator = '/'
} = {}) => {
  const emitter  = Emitter()
  const RootLens = Prop('ROOT')

  let state = Set(RootLens)(initialState)({})

  const Way = (path) => {
    const xs = eq('')(path) ? [] : split(separator)(path)
    const origin = join(separator)(reverse(tail(reverse(xs))))
    const key = last(xs) || ''

    const lens = apply(compose)(compose(
      prepend(RootLens),
      map(Prop)
    )(xs))

    return freeze({
      parent: () => Way(origin),
      origin: () => origin,
      key: () => key,
      lens: () => lens,
      child: (key) => Way(join(separator)([path, key])),
      toString: () => join(separator)(xs),
      valueOf: () => get(path)
    })
  }

  const buildEventKey = (type, path) => join('://')([type, path])

  const buildEvent = (type, way) => freeze({ type, way })

  const Events = (way, types) => {
    const emitterStateKeys = keys(emitter.state())

    const buildCreatedEvents = (way, acc = []) => {
      if (ne('')(way.key())) {
        const key = buildEventKey('created', way.origin())
        const found = find(eq(key))(emitterStateKeys)
        if (found && not(way.valueOf())) {
          acc = append(buildEvent('created', way))(acc)
        }
        return buildCreatedEvents(way.parent(), acc)
      }
      return acc
    }

    const buildRemovedEvents = (way, acc = []) => {
      const childs = reduce((acc, key) => {
        return concat(buildRemovedEvents(way.child(key)))(acc)
      })([])(keys(way.valueOf()))
      const key = buildEventKey('removed', way.origin())
      const found = find(eq(key))(emitterStateKeys)
      if (found) {
        acc = append(buildEvent('removed', way))(acc)
        acc = concat(acc)(childs)
      }
      return acc
    }

    const buildChangedEvents = (way, acc = []) => {
      if (ne('')(way.key())) {
        const key = buildEventKey('changed', way.origin())
        const found = find(eq(key))(emitterStateKeys)
        if (found) {
          acc = append(buildEvent('changed', way))(acc)
        }
        return buildChangedEvents(way.parent(), acc)
      }
      return acc
    }

    const events = {
      created: buildCreatedEvents,
      removed: buildRemovedEvents,
      changed: buildChangedEvents
    }

    return reduce((acc, type) => {
      return concat(acc)(apply(events[type])([way]))
    })([])(types)
  }

  const emit = (events) => {
    each(({ type, way }) => {
      const key = buildEventKey(type, way.origin())
      const payload = freeze({
        key: way.key(),
        origin: way.origin(),
        value: way.valueOf(),
        path: way.toString()
      })

      emitter.emit(key)(payload)
    })(events)

    return void(0)
  }

  const get = (path) => {
    const way = Way(path)
    return Get(way.lens())(state)
  }

  const set = (path) => (value) => {
    const way = Way(path)
    const events = Events(way, ['created', 'changed'])
    state = Set(way.lens())(value)(state)
    emit(events)
    return void(0)
  }

  const del = (path) => {
    const way = Way(path)
    const events = Events(way, ['removed', 'changed'])
    state = Over(way.parent().lens())(dissoc(way.key()))(state)
    emit(events)
    return void(0)
  }

  return freeze({
    set,
    get,
    del,
    on: (type, path) => emitter.on(buildEventKey(type, path)),
    off: (type, path) => emitter.off(buildEventKey(type, path))
  })
}

export default Store
