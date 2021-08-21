## applet-redux


applet-redux 是支持redux能够在小程序里面进行状态管理的库，用于跨组件共享数据，并且会响应的更新组件。
如果你会使用redux或者dva那么上手成本基本为0


很轻量，大概 4 KB 左右大小。


## 安装


```
npm install --save applet-redux
```


## api


import { provider, connect, createModel } from 'applet-redux';
​

### provider
provider： 在app.js 注册store
​

store 可以是由 redux 的 createStore() 创建的，但是这个时候你需要自己定义reduce和模块拆分。
使用redux你需要先安装，npm install --save redux，
​

store 也可以是由 createModel 方法进行创建，使用这个方法不需要安装 redux，因为在其内部实现了一个可用的简易版redux，更轻量。
```javascript
import { provider } from 'applet-redux';

// provider 注入 store
App(provider({ store })({
  onLaunch(options) {
    // 第一次打开
    console.log(options.query);
  },
}));
```


### connect
**connect** 这里请注意只能应用于 **Component**，不能用于**Page**
​

connect(mapStateToData, mapDispatchToProps, shouldComponentUpdate);
​


- mapStateToData：**取store的数据设置到data上**，注意这里和react-redux不同的是。一个是data，一个是props。
- mapDispatchToProps：同react-redux使用方式一致，可以进行封装dispatch
- shouldComponentUpdate：组件更新的判断函数 (prevState, currentState) => // 返回true更新组件，false 不更新组件。
```javascript
// connect 方法使用，这里请注意只能应用于 Component，不能用于Page
import { connect } from 'applet-redux';

// state 模块数据，或者redux你自己定义的数据
// 任何地方 dispatch 更新了 titleHeight 都会更新组件
// axml文件和js文件可以直接使用
// 使用 connect 包裹的组件 props 会传入 dispatch
Component(connect(state => ({
  titleHeight: state.global.titleHeight, // 这里是因为下面的文档定义了一个global的模块
}))({
  data: {}, // titleHeight 会赋值给 data 
  didMount() {
    // 使用 connect 包裹的组件 props 会传入 dispatch
    this.props.dispatch({
      type: 'global/onFetch', // 触发 action
    })
    console.log(this.data.titleHeight);
  },
  didUpdate() {
    console.log(this.data.titleHeight);
  },
}));
```


### createModel


对redux进行模块化封装的api
##### 请仔细参考下面模块的代码，列举上了全部的api


```javascript
import { provider, createModel } from 'applet-redux';

// 定义一个模块
const globalModel = {
  // 模块名
  namespace: 'global',
  // 模块数据
  state: {
    titleHeight: 0, 
  },
  // 模块加载完成后执行的代码，可以用于异步初始化数据
  subscriptions({ dispatch, subscribe }) {
    // 获取系统高度
    setTimeout(() => {
      dispatch({
        type: 'setState',
        titleHeight: 100,
      });
    }, 2000);
    subscribe(() => {
      console.log('监听触发dispatch');
    });
  },
  // 异步设置 dispatch，这里可以采用 async 语法
  effects: {
    async onFetch(value, { dispatch, getState }) {
      console.log(getState()); // 获取到所有state的值
      console.log(getState().global); // 获取到当前模块state的值
      await dispatch({ type: 'setState', ...value });
    },
    async onAdd({ titleHeight }, { dispatch, getState }) {
      await dispatch({ type: 'setState', titleHeight });
    },
  },
  // dispatch 更改 state 的值，这里不能使用async语法
  reducers: {
    setState(state, value) {
      return { ...state, ...value };
    },
  },
}

// createModel 创建模块，并且设置
const store = createModel({
  models: [globalModel],
});


```


## 快速使用


1. 使用 globalModel 创建模块，并编写模块代码
1. 在app.js 调用 provider
1. 在Component处使用connect进行数据的关联



app.js


```javascript
import { provider, createModel } from 'applet-redux';

const globalModel = {
  namespace: 'global',
  state: {
    titleHeight: 0,
  },
  subscriptions({ dispatch, subscribe }) {
    subscribe(() => {
      console.log('监听触发dispatch');
    });
  },
  effects: {
    async onFetch({ titleHeight }, { dispatch, getState }) {
      console.log(getState()); 
    },
  },
  reducers: {
    setState(state, value) {
      return { ...state, ...value };
    },
  },
};

const store = createModel({ models: [globalModel] });

App(provider({ store })({
  onLaunch(options) {
    // 第一次打开
    console.log(options.query);
  },
}));
```


组件，Component处使用 connect 方法


```javascript
import { connect } from 'applet-redux';

Component(connect(state => ({
  titleHeight: state.global.titleHeight,
}))({
  didMount() {
    this.props.dispatch({
      type: 'global/onFetch', // 触发 action
    })
    console.log(this.data.titleHeight);
  }
}));
```


## 使用 redux


在使用之前需要先安装 npm install --save redux
```javascript
import { provider } from 'applet-redux';
import { createStore } from 'redux';

const store = createStore(reduce); // 参考redux文档 https://www.redux.org.cn/

// provider 注入 store
App(provider({ store })({
  onLaunch(options) {
    // 第一次打开
    console.log(options.query);
  },
}));
```
组件，Component处使用 connect 方法


```javascript
import { connect } from 'applet-redux';

Component(connect(state => ({
  state,
}))({
  didMount() {
    this.props.dispatch({
      type: 'xxx', // 触发 你自己定义的action
    })
    console.log(this.data);
  }
}));
```
