const R = require('ramda')

const defaultAction = {
  type: null,
  payload: null
}

const ActionTypeLens = R.lensProp('type')

const ActionPayloadLens = R.lensProp('payload')

const actionTypeEqual = function actionTypeEqual (type, action) {
  return R.equals(type, R.view(ActionTypeLens, action))
}

const createActionType = function createActionType (type) {
  return function (payload) {
    return R.compose(
      R.set(ActionPayloadLens, payload),
      R.set(ActionTypeLens, type)
    )(defaultAction)
  }
}

module.exports = {
  ActionTypeLens,
  ActionPayloadLens,
  actionTypeEqual,
  createActionType
}
