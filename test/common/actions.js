const { ADD_ITEM, TOGGLE_ITEM } = require('./constants')
const { createActionType } = require('./utils')

module.exports = {
  addItem: createActionType(ADD_ITEM),
  toggleItem: createActionType(TOGGLE_ITEM)
}
