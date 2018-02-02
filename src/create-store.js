const is = require('ramda/src/is')
const of = require('ramda/src/of')
const has = require('ramda/src/has')
const not = require('ramda/src/not')
const append = require('ramda/src/append')
const reduce = require('ramda/src/reduce')
const applyTo = require('ramda/src/applyTo')
const forEach = require('ramda/src/forEach')
const without = require('ramda/src/without')

const defaultState = {}

const defaultReducer = function (state, action) {
  return state
}

const createStore = function createStore (reducer, initialState) {
  let currentReducer = reducer || defaultReducer
  let currentState = initialState || defaultState

  if (not(is(Function, currentReducer))) {
    throw new TypeError('reducer argument should be a function')
  }

  if (not(is(Object, currentState))) {
    throw new TypeError('state argument should be a POJO')
  }

  let listeners = []

  const state = function () {
    return currentState
  }

  const unsubscribe = function unsubscribe (listener) {
    if (not(is(Function, currentReducer))) {
      throw new TypeError('listener argument should be a function')
    }

    listeners = without(of(listener), listeners)
  }

  const subscribe = function subscribe (listener) {
    if (not(is(Function, currentReducer))) {
      throw new TypeError('listener argument should be a function')
    }

    listeners = append(listener, listeners)

    return function () {
      unsubscribe(listener)
    }
  }

  const dispatch = function dispatch (action) {
    if (not(is(Object, action))) {
      throw new TypeError('action argument should be a POJO')
    }

    if (not(has('type', action))) {
      throw new TypeError('action argument must be a key: type')
    }

    if (not(has('payload', action))) {
      throw new TypeError('action argument must be a key: payload')
    }

    currentState = reduce(currentReducer, state(), of(action))
    forEach(applyTo(currentState), listeners)
    return action
  }

  return {
    state,
    subscribe,
    dispatch
  }
}

module.exports = createStore
