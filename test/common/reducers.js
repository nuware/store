const R = require('ramda')

const { ADD_ITEM, TOGGLE_ITEM } = require('./constants')
const { actionTypeEqual, ActionPayloadLens } = require('./utils')

const itemsReducer = function (state, action) {
  const payload = R.view(ActionPayloadLens)

  if (actionTypeEqual(ADD_ITEM, action)) {
    const itemsLens = R.lensProp('items')
    const items = R.append(payload)(R.view(itemsLens, state))
    return R.set(itemsLens, items)(state)
  }

  if (actionTypeEqual(TOGGLE_ITEM, action)) {
    const itemLens = R.lensProp('item')
    return R.set(itemLens, action.payload)(state)
  }

  return state
}

module.exports = {
  itemsReducer: itemsReducer
}
