/* global describe, it */

const assert = require('chai').assert

const createStore = require('../')

const initialState = require('./common/state')
const reducer = require('./common/reducers').itemsReducer
const actions = require('./common/actions')

// const { ADD_ITEM, TOGGLE_ITEM } = require('./common/constants')
// const { createActionType } = require('./common/utils')

describe('createStore', function () {
  describe('.state()', function () {
    it('isFunction', function () {
      const store = createStore(reducer, initialState)
      assert.isFunction(store.state)
    })

    it('exec', function () {
      const store = createStore(reducer, initialState)
      assert.equal(store.state(), initialState)
    })
  })

  describe('.dispatch()', function () {
    it('isFunction', function () {
      const store = createStore(reducer, initialState)
      assert.isFunction(store.dispatch)
    })

    it('exec', function () {
      const store = createStore(reducer, initialState)

      const action = actions.addItem({
        a: true
      })

      assert.equal(store.dispatch(action), action)
    })
  })

  describe('.subscribe()', function () {
    it('isFunction', function () {
      const store = createStore(reducer, initialState)
      assert.isFunction(store.subscribe)
    })

    it('return isFunction', function () {
      const store = createStore(reducer, initialState)
      assert.isFunction(store.subscribe(function () {}))
    })

    it('exec', function (done) {
      const store = createStore(reducer, initialState)
      const action = actions.toggleItem(false)

      store.subscribe(function (state) {
        assert.isFalse(state.item)
        done()
      })

      store.dispatch(action)
    })
  })
})
