/**
 * @Auther: 陈林
 * @Date: 2021/8/2 5:55 下午
 * @Description: applet-redux
 */

import { createStore, combineReducers } from './redux';

const storeKey = 'REDUX_STORE';

// provider
export function provider({ store }) {
  if (typeof store === 'undefined') {
    throw new Error('store 为空');
  }
  return function (options = {}) {
    const { globalData = {} } = options;
    options.globalData = Object.assign(globalData, { [storeKey]: store });
    return options;
  };
}

function defaultShouldComponentUpdate(prevState, currentState) {
  if (Object.is(prevState, currentState)) {
    return false;
  }
  const prevStateKeys = Object.keys(prevState);
  const currentStateKeys = Object.keys(currentState);
  if (prevStateKeys.length !== currentStateKeys.length) {
    return true;
  }
  return prevStateKeys.some(key => prevState[key] !== currentState[key]);
}

function defaultMapDispatchToProps(dispatch) {
  return {
    dispatch,
  };
}

// connect
export function connect(
  mapStateToData = undefined,
  mapDispatchToProps = defaultMapDispatchToProps,
  shouldComponentUpdate = defaultShouldComponentUpdate,
) {
  return function (options = {}) {
    if (!getApp) {
      throw new Error('全局没有 getApp() 方法');
    }
    const store = getApp?.().globalData[storeKey];
    if (typeof store === 'undefined') {
      throw new Error('store 为空');
    }
    const { getState, subscribe, dispatch } = store;
    const { didMount, didUnmount, props = {}, data = {} } = options;
    options.props = Object.assign(props, mapDispatchToProps?.(dispatch), { dispatch });
    if (!mapStateToData) {
      return options;
    }
    let prevState = mapStateToData?.(getState());
    options.data = Object.assign(data, prevState);
    let unSubscribe;

    options.didMount = function (...args) {
      unSubscribe = subscribe(() => {
        const state = mapStateToData?.(getState());
        if (shouldComponentUpdate(prevState, state)) {
          prevState = state;
          this.setData(state);
        }
      });
      return didMount && didMount.call(this, ...args);
    };

    options.didUnmount = function (...args) {
      unSubscribe?.();
      return didUnmount && didUnmount.call(this, ...args);
    };

    return options;
  };
}

// 创建 model
export function createModel({ models = [] }) {
  const reducers = {};
  const subscribes = {};
  const effects = {};
  const filterModels = models?.filter((item, i, arr) => {
    const result = arr.findIndex(record => record.namespace === item.namespace) === i;
    if (!result) {
      console.error(`有重复模块，请确认 namespace：${item.namespace}`);
    }
    return result;
  });

  filterModels?.forEach(item => {
    const {
      namespace,
      state: initState,
      reducers: reducer,
      effects: effect,
      subscriptions,
    } = item;
    // 绑定 reducer
    reducers[namespace] = function (state = initState, action = {}) {
      const { type: actionType = '', ...other } = action;
      const [currentNamespace, type] = actionType.split('/');
      if (currentNamespace === namespace) {
        if (reducer[type]) {
          return reducer[type]?.(state, other);
        }
      }
      return state;
    };
    // 添加 subscriptions
    subscribes[namespace] = subscriptions;
    // 添加 effect
    effects[namespace] = effect;
  });

  const store = createStore(combineReducers(reducers));

  // 支持 effect 异步逻辑
  const dispatch = (action) => {
    const { type: actionType, ...other } = action;
    const [namespace, type] = actionType.split('/');
    if (effects?.[namespace]?.[type]) {
      return effects[namespace]?.[type]?.(other, {
        getState: store.getState,
        dispatch(action = {}) {
          const { type = '' } = action;
          action.type = type.includes('/') ? type : `${namespace}/${type}`;
          return dispatch(action);
        },
      });
    }
    return store.dispatch(action);
  };

  // 执行 subscriptions
  Object.keys(subscribes)?.forEach((item) => {
    subscribes?.[item]?.({
      subscribe: store.subscribe,
      dispatch(action = {}) {
        const { type = '' } = action;
        return dispatch({
          ...action,
          type: type.includes('/') ? type : `${item}/${type}`,
        });
      },
    });
  });

  return {
    ...store,
    dispatch,
  };
}
