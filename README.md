
## 用于小程序的状态管理工具

### 介绍
wechat-rematch是针对原生小程序的状态管理工具，之所以叫rematch只是因为用法和rematch一样。

### 初衷
之所以要写这样一个工具是因为最近尝试用小程序写比较复杂的应用时涉及到了组件拆分，那就免不了用到微信自己提供的component,组件拆分带来的问题就是组件之间数据怎么传递，子组件怎么调用父组件的方法。

使用微信提供的原生方法肯定是可以实现的，但实在太繁琐了，数据需要从页面到组件层层传递，子组件只能通过trigger去触发在父组件中定义的方法，而且不能跨级trigger，也就是说子组件只能trigger它直接父组件中定义的方法，如果需要触发page中的方法，是需要通过父组件作为中间层去触发的。这实在太反人类了。

于是写了wechat-rematch来专门管理数据，触发事件，无论是页面还是组件，都只需要在内部调用dispatch就可以改变任意的state,绑定了相应数据的组件会自动更新。

## 用法

### 安装

```
npm install wechat-rematch
```
### 使用

* 小程序开发工具顶部工具栏：工具->构建npm

* 小程序右侧工具栏：勾选“使用npm模块”

* 参考以下demo,在代码中定义自己的models，用createStore组装所有models,按以下步骤改造app.js、Page、Component

### 定义models

models/count.js
```
  const count={
    state:{
      count:0
    },
    //处理直接修改state的事件
    reducers: {
      increment: (state, payload) => {
        return Object.assign(state, { count: state.count + payload })
      },
    },
    //处理事件
    effects: (dispatch) => ({ 
      async incrementAsync(payload, rootState) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        dispatch.count.increment(payload)
      }
    })
  }
  module.exports  = count;
```

### 生成store

```
const { createStore } = require("wechat-rematch")
const count = require('./models/count')
const store = createStore({
  models:{
    count
  }
})
module.exports = store
```

### 改造app.js

```
  const { Provider } = require("wechat-rematch")
  const store = require('./store')
  App(
    Provider(store)({
      onLaunch: function () {
      }
    })
  )
```

### 改造Page

```
const { connect } = require("wechat-rematch")
//将count注入页面的data
function mapStateToData(state){
  return {
    count: state.count.count
  }
}
Page(connect(mapStateToData)({
  data:{

  },
  onLoad: function() {
   
    
  },
  add: function(){
    
    this.dispatch.count.increment(1)
  },
  addAsync: function(){
    this.dispatch.count.incrementAsync(1)
  }
}))
```

### 改造Component

```
const { connect } = require("wechat-rematch")
//将count注入组件的data
function mapStateToData(state) {
  return {
    count: state.count.count
  }
}
Component(connect(mapStateToData)({

  /**
   * 组件的方法列表
   */
  methods: {
    add:function(){
      console.log(this.data.count)
      this.dispatch.count.increment(1)
    }
  }
}))

```

### 原理

wechat-rematch主要提供  Provider,connect,createStore三个方法。

#### Provider

provider用来改造app.js，它只做了一件事，就是给app增加一个store属性，好让所有页面可以通过`getApp().store`来访问到store。

#### connect

connect做三件事

* 将mapStateToData方法返回的数据绑定到page或者component上，当这些数据发生改变时，connect内部调用小程序原生的setDate去促使页面重渲染，因为小程序的setData是线程间的通信，官方文档介绍是尽量不要给setData传递大量数据，所以在connect内部还做了前后数据diff的比较，保证每次触发setData的数据是最小必须数据。

* 当页面或组件不在当前视口中时注销事件监听，避免不必要的setData;当页面或组件回到视口时发起一次setData以保证他们渲染正确的数据

* 将store.dispatch绑定到page或者component上，这样就可以在内部使用`this.dispatch.XXmodel.xxReducer`去触发action


#### createStore

createStore主要完成三件事

* 解析所有注册的models，收集他们的state,挂载到rootState上

* 遍历models的reducers和effects方法，给这些方法传递state作为参数，并注入setData方法

* 将reducers和effects方法全部绑定到store.dispatch上。