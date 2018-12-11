# 用法
## 定义models
models/count.js
```
  const count={
    state:{
      count:0
    },
    //reducers中的方法用于直接修改自己的state,每个方法需返回新的state
    reducers: {
      increment: (state, payload) => {
        return Object.assign(state, { count: state.count + payload })
      },
    },
    //effects中的方法相当于redux中的action,用于处理数据操作，dispatch下包括所有models的reducers和effects,rootState包括所有models的state
    effects: (dispatch) => ({ 
      async incrementAsync(payload, rootState) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        dispatch.count.increment(payload)
      }
    })
  }
  module.exports  = count;
```
## 生成store
```
const { createStore } = requirePlugin("wechat-rematch")
const count = require('./models/count')
const store = createStore({
  models:{
    count
  }
})
module.exports = store
```
## 改造app.js
```
  const { Provider } = requirePlugin("wechat-rematch")
  const store = require('./store')
  App(Provider(store)({
    onLaunch: function () {
    }
  }))
```
## 改造Page
```
const { connect } = requirePlugin("wechat-rematch")
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
  }
}))
```

## 组件生命周期

### 销毁
* 左上角返回  只会detached
* redirectTo别的页面 只会detached
* navagateTo别的页面 只会page hide
* 在当前页面上消失 detached

### 出现

* 正常出现：created attached pageshow ready
* 被别的页面从左上角返回： pageshow
* 在当前页面上出现：created attached ready

