/**
 * 引用相对路径的模块，此处用于解决外网域名问题
 * 如: api.sit.ffan.com
 * @type {fixDomain}
 */
const fixDomain = require('./domain').fixDomain

/**
 * 利用模块域存放本地数据，例如某些初始化配置，样式主题等
 * @type {{message}}
 */
let data = {
  'message': data,
}

/**
 * 设置插件作用域的数据
 * @param value
 */
function setData(value) {
  data = value
}

function getData() {
  return data
}

/**
 * 请求服务端接口，此demo模拟请求广场数据
 * 需要特别注意的是，服务端接口在授权小程序中，需添加至插件白名单
 * @param ids
 * @return {Promise<Response>}
 */
const getPlazaIds = ids => fetch(
  fixDomain(`/plazas/${ids}`, __ENV__), {
    method: 'get'
  }
)

/**
 * 通过 CommonJS modules 规范暴露接口
 * @type {{getPlazaIds: function(*): Promise<Response>, setData: setData}}
 */
module.exports = {
  getPlazaIds,
  setData,
  getData,
}


// const plazaAPI = requirePlugin('chargePlugin')
//
// plazaAPI.getPlazaIds()
