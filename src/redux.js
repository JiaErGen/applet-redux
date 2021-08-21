/**
 * @Auther: 陈林
 * @Date: 2021/8/2 5:55 下午
 * @Description: 简写版本的redux
 */

// reducer 模块拆分
export function combineReducers(reducers = {}) {
  const keys = Object.keys(reducers);
  return function (state = {}, action) {
    return keys.reduce((reduce, key) => {
      reduce[key] = reducers[key]?.(state[key], action);
      return reduce;
    }, {});
  };
}

// 创建 store
export function createStore(reducer, initState) {
  let currentReducer = reducer;
  let state = initState || currentReducer(initState, {});
  const listeners = [];

  function getState() {
    return state;
  }

  function dispatch(action = {}) {
    if (typeof action.type === 'undefined') {
      throw new Error('action.type 为空');
    }
    state = currentReducer(state, action);
    listeners.forEach((item) => item());
    return action;
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error(`subscribe 入参不是函数：${listener}`);
    }
    listeners.push(listener);
    return function unSubscribe() {
      listeners.splice(listeners.indexOf(listener), 1);
    };
  }

  function replaceReducer(newReducer) {
    currentReducer = newReducer;
    dispatch({ type: 'REDUX_REPLACEREDUCER' });
  }

  dispatch({ type: 'REDUX_INIT' });

  return {
    getState,
    dispatch,
    subscribe,
    replaceReducer,
  };
}
