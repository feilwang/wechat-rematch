let diff = require('object-diff')
import deepClone from 'deep-clone'
function connect(mapStateToData,mapDispatchToPage){
  let store = getApp().store;
  return function(pageConfig){
    //页面生命周期覆盖
    let _onShow = pageConfig.onShow
    let _onHide = pageConfig.onHide
    function onShow(options) {
       
      //只能通过onShow来获取真正的this
      pageConfig.triggerChange = (data)=>{
        this.setData(data)
      }
      //每次页面显示就setData
      let data = mapStateToData(store.getState())
      //获取有区别的数据，防止setData数据量过大
      let diffData=(this.data,data)
      this.setData(diffData)
      _onShow && _onShow.call(this,options)
      
    }
    function onHide(){

      delete pageConfig.triggerChange
      _onHide && _onHide.call(this)
    }
    
    Object.assign(pageConfig,{onShow,onHide})

    //组件生命周期覆盖
    let _pageLifetimes = pageConfig.pageLifetimes||{}
    let _show = _pageLifetimes.show
    let _hide = _pageLifetimes.hide
    let pageLifetimes={
      show: function(){
        let data = mapStateToData(store.getState())
        let diffData=(this.data,data)
        this.setData(diffData)
        pageConfig.triggerChange = (data)=>{
          this.setData(data)
        }
        _show && _show.call(this)
      },
      hide: function(){
        delete pageConfig.triggerChange
        _hide &&_hide.call(this)
      }
    }
    Object.assign(_pageLifetimes,pageLifetimes)
    Object.assign(pageConfig,{pageLifetimes:{..._pageLifetimes}})

    let _lifetimes = pageConfig.lifetimes||{}
    let _detached = _lifetimes.detached
    let _ready = _lifetimes.ready
    let lifetimes={
      detached: function(){
        delete pageConfig.triggerChange
        _detached && _detached.call(this)
      },
      ready: function(){
        let data = mapStateToData(store.getState())
        let diffData=(this.data,data)
        this.setData(diffData)
        pageConfig.triggerChange = (data)=>{
          this.setData(data)
        }
        _ready && _ready.call(this)
      }
    }
    Object.assign(_lifetimes,lifetimes)
    Object.assign(pageConfig,{lifetimes:{..._lifetimes}})

    
    
    let data = deepClone(mapStateToData(store.getState()))
    store.views.push({ view: pageConfig, mapStateToData})
    Object.assign(pageConfig.data,data)
    pageConfig.dispatch = store.dispatch

    return pageConfig
  }
}
module.exports=connect;