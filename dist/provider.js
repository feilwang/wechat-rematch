function Provider(store){
  
  return (appObj)=>{
    appObj.store = store
    
    return appObj
  }
}
module.exports = Provider