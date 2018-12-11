let diff = require('object-diff')
import deepClone from 'deep-clone'
function createStore(config){
  
  let models = config.models
  let store={
    models: models,
    views:[],
    getState: ()=>{
      let states = {}   
      Object.keys(models).map((key) => {
        states[key] = models[key].state
      })
      return states
    },
    dispatch:{}
  }
  let rootState = store.getState();
  //由事件触发一次所有view的变更
  function handleChange(){
    let rootState = store.getState()//这里必须重新取一次state,是因为有些state是纯数字，没法通过引用自动修改
    store.views.map((viewWrap)=>{
      let {view,mapStateToData} = viewWrap;
      
      let data = mapStateToData(rootState)
      if(view.triggerChange){
        let diffData = diff(view.data,data)
        view.triggerChange(diffData)
      }
    })
  }
  
  //遍历reducers和effects，分别传入state和rootState,并触发数据变化，并都绑到dispatch上
  Object.keys(models).map((key)=>{
    let model = models[key];
    let reducers = model.reducers;
    let effects = model.effects(store.dispatch);

    store.dispatch[key] = {}
    for(let func in reducers){
      let fn = reducers[func];
      
      store.dispatch[key][func] = (payload)=>{
        model.state = fn(model.state,payload)
        handleChange();
      }
    }
    for(let func in effects){
      let fn = effects[func];
      
      store.dispatch[key][func] =  (payload) => {
         fn(payload,rootState)
      }
    }
    
  })
  return store
}
module.exports=createStore