import deepClone from 'deep-clone'

const diff = require('object-diff')

const defaultMapStateToData = () => ({})

function connect(mapStateToData = defaultMapStateToData) {
  const store = getApp().store
  return function (pageConfig) {
    if(!pageConfig.data){
      pageConfig.data={}
    }
    // 页面生命周期覆盖
    const _onShow = pageConfig.onShow
    const _onHide = pageConfig.onHide
    function onShow(options) {
      // 只能通过onShow来获取真正的this
      pageConfig.triggerChange = (data) => {
        this.setData(data)
      }
      // 每次页面显示就setData
      const data = mapStateToData(store.getState())
      // 获取有区别的数据，防止setData数据量过大
      const diffData = (this.data, data)
      this.setData(diffData)
      _onShow && _onShow.call(this, options)
    }
    function onHide() {
      delete pageConfig.triggerChange
      _onHide && _onHide.call(this)
    }

    Object.assign(pageConfig, { onShow, onHide })

    // 组件生命周期覆盖
    const _pageLifetimes = pageConfig.pageLifetimes || {}
    const _show = _pageLifetimes.show
    const _hide = _pageLifetimes.hide
    const pageLifetimes = {
      show() {
        this.dispatch = store.dispatch
        const data = mapStateToData(store.getState())
        const diffData = (this.data, data)
        this.setData(diffData)
        pageConfig.triggerChange = (data) => {
          this.setData(data)
        }
        _show && _show.call(this)
      },
      hide() {
        delete pageConfig.triggerChange
        _hide && _hide.call(this)
      },
    }
    Object.assign(_pageLifetimes, pageLifetimes)
    Object.assign(pageConfig, { pageLifetimes: { ..._pageLifetimes } })

    const _lifetimes = pageConfig.lifetimes || {}
    const _detached = _lifetimes.detached
    const _ready = _lifetimes.ready
    const lifetimes = {
      detached() {
        delete pageConfig.triggerChange
        _detached && _detached.call(this)
      },
      ready() {
        this.dispatch = store.dispatch
        const data = mapStateToData(store.getState())
        const diffData = (this.data, data)
        this.setData(diffData)
        pageConfig.triggerChange = (data) => {
          this.setData(data)
        }
        _ready && _ready.call(this)
      },
    }
    Object.assign(_lifetimes, lifetimes)
    Object.assign(pageConfig, { lifetimes: { ..._lifetimes } })


    const data = deepClone(mapStateToData(store.getState()))
    store.views.push({ view: pageConfig, mapStateToData })
    Object.assign(pageConfig.data, data)
    pageConfig.dispatch = store.dispatch

    return pageConfig
  }
}
module.exports = connect
