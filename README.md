# 小程序插件方案调研

[toc]

## 1. 概要

小程序插件的本质是以小程序[自定义组件][1]（component）为载体，通过微信公众平台的审核机制发布，提供给第三方小程序调用功能的一种封装形式。

插件既可以只含js文件（提供API接口，配置，通用函数，SDK等），
也可以是一个或多个组件（提供模板、样式及数据集合等）。

需要注意的是：插件中的组件除了需遵循插件的目录结构、[构造方法][2]和生命周期外，只能通过配置文件显示声明外部可被调用的方法。原因是出于插件保护策略，运行时的小程序容器无法获取插件内的组件实例对象（[参考文档][3]）。

## 2. 文件目录结构

上传的小程序中，分为运行事例和插件源码两部分，其中放在「miniprogram」文件夹中的程序，只做开发和调试使用。真正上传的并分发给授权小程序的代码，是经过打包压缩后的「plugin」文件夹里的代码，这部分公司是由微信开放平台完成的，其中「api」用于存放外部接口，「components」用于放置组件。

![目录结构](http://timg.ffan.com/convert/resize/url_T13uYgBjEj1RCvBVdK/tfs/eb3bff2f25b3965d3dd0a5ec356b1572.png)

## 3. 接口使用方法

### 接口开发代码示例

小程序接口可以利用插件作用域存储数据，也可以请求服务端接口。需要特别说明的是，调用服务端的接口域名需要加白。

> 接口开发代码示例
> plugin/api/data.js

```javascript
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
}
```

### 接口开发调用示例

使用 `requirePlugin` 方法获取插件的实例

```javascript
const plazaAPI = requirePlugin('wanda-plaza')
plazaAPI.getPlazaIds()
```

## 4. 组件使用方法

被外部调用的组件需要在 `plugin/plugin.json` 中声明引用，通过键值对的方式暴露给授权小程序。代码如下：

plugin/plugin.json
```js
{
  /* publicComponents 暴露插件的组件引用  */
  "publicComponents": {
    "list": "components/list/list",
    "plazaList": "components/plazaList/plazaList"
  },
  /* main值决定插件接口的入口文件  */
  "main": "index.js"
}
```

### 组件开发代码示例

小程序内的插件组件由 json wxml wxss js 4个文件组成，与自定义组件不同的地方是，插件由于内部保护机制，部分接口不可调用，具体可参考[插件调用 API 的限制][4]

plugin/components/list/list.js
```
Component({
  /**
   * 插件内组件的私有数据，在视图内属于单项绑定关系
   */
  data: {
    list: []
  },
  methods: {
    /**
     * 公有方法，可被外部组件调用
     * @param product
     */
    send: (product) => {
      this._mockSendData(product.price, 1000)
    },
    /**
     * 私有方法，建议以下划线开头
     * @param data
     * @param delay
     * @return {Promise<any>}
     * @private
     */
    _mockSendData: (data, delay) => new Promise((resolve, reject) => {
      setTimeout(function () {
        resolve(data)
      }, delay)
    }),
    /**
     * 该方法可被 wxml 模板中的结构进行绑定
     * @param e
     */
    buy: function (e) {
      const current = this.data.list.find(
        item => String(item.id) === e.target.id)
      if (!current) {
        console.log('--Not found--')
        return
      }
      wx.showLoading({
        title: '请稍候',
        mask: true,
      })
      this.send(current).then(value => {
        wx.showToast({
          title: `成功支付${value}元`
        })
      })
    }
  },
  /**
   * 生命周期函数，在组件加载时被调用
   */
  attached: function () {
    this.setData({
      list: [{
        id: 101,
        name: '水费',
        price: 1
      }, {
        id: 102,
        name: '电费',
        price: 2
      }, {
        id: 103,
        name: '燃气费',
        price: 3
      }]
    })
  },
})

```

plugin/components/list/list.wxml
```html
<view class="product-header">
  生活缴费
</view>
<view wx:for="{{list}}" wx:key="id" class="product-list">
  <view class="product-item">
    <text class="product-text">{{item.name}}</text>
    <text class="product-price">{{item.price}}元</text>
    <button size="mini" id="{{item.id}}" class="product-btn-buy" bindtap="buy">购买</button>
  </view>
</view>
```

plugin/components/list/list.wxss
```css
.product-header {
  font-size: 20px;
  margin: 20px 0;
  padding: 0 20px;
  border-bottom: 1px solid #ccc;
}

.product-item {
  display: flex;
  padding: 0 20px;
  color: #666666;
  justify-content: space-between;
  align-items: center;
  height: 120rpx;
  border-bottom: 1px solid #cccccc;
}

.product-text {
  flex: 2 1 auto;
}

.product-price {
  color: orangered;
  font-size: 14px;
  width: 150rpx;
  flex: 0 1 auto;
}

.product-btn-buy {
  flex: 0 1 auto;
}
```

最后，插件内部是需要基础设置:

project.config.json
```json
{
	"miniprogramRoot": "./miniprogram",
	"pluginRoot": "./plugin",
	"compileType": "plugin",
	"setting": {
		"newFeature": true
	},
	"appid": "wxb7cce62bced42205",
	"projectname": "square_plugins",
	"condition": {}
}
```

当上述工作完成后，通过与小程序一致的入口上传程序，即可走审核流程了

![image_1c9mh1f1p140a4ls17381s24hld9.png-25.2kB][5]

### 组件调用代码示例

在插件通过审核后，第三方插件通过选择「设置」-「第三方服务」-「插件管理」中选择「添加插件」，输入插件 AppID，提出插件使用申请。

开发者可以在小程序插件审核插件使用申请，可以通过、拒绝申请。

![image_1c9mh9f211ibj27g1bkbiksbbrm.png-26.6kB][6]

授权的第三方小程序（比如周浦广场）项目根目录下的 `app.json` 声明调用的插件：

miniprogram/app.json
```
{
  "pages": [
    "pages/index/index"
  ],
  "plugins": {
    /** 
     * 此处是插件对外暴露的key
     * 一个第三方小程序可以引用多个小程序插件
     */
    "chargePlugin": {
      "version": "dev",
      /* 调用小程序的值是 project.config.json 的appid */
      "provider": "wxb7cce62bced42205"
    }
  }
}
```

这样即可在程序内调用小程序插件了！

![image_1c9mht86h4fa1g5c7a36ec1pdk13.png-31.5kB][7]

## 5. 插件发布注意事项

### 「类目不一致」不过审

提交插件遇到「类目不一致」的问题，目前只有一部分类目开放小程序插件申请功能。

![小程序类目][8]

咱们测试广场的小程序「线下超市」就不能开发小程序：

![image_1c9mijvolr9l174t17feoe81nr21t.png-23.4kB][9]

当前允许开发的小程序类目如下：

[开放范围及服务类目][10]

### 「插件名称」与「类目」不匹配，不过审

因为「插件名称」目前不开放修改，所以申请开发插件前请慎重！再慎重！
测试帐号就因为申请名称为「广场」。**审核通过的前提条件是：插件名称，插件内容，插件类目 三者完全匹配**。

![image_1c9mirr6917n1efj181l11vd1a2m2a.png-17.1kB][11]

## 6. 参考文档

> [插件接入指南][12]
>[小程序插件审核又没过？教你避开这几个坑][13]


  [1]: https://mp.weixin.qq.com/debug/wxadoc/dev/framework/custom-component/
  [2]: https://mp.weixin.qq.com/debug/wxadoc/dev/framework/custom-component/component.html
  [3]: https://mp.weixin.qq.com/debug/wxadoc/dev/framework/plugin/using.html
  [4]: https://developers.weixin.qq.com/miniprogram/dev/framework/plugin/api-limit.html
  [5]: http://static.zybuluo.com/leiming/l2w3yvj1x3vm1o3fbnm0mewu/image_1c9mh1f1p140a4ls17381s24hld9.png
  [6]: http://static.zybuluo.com/leiming/k0lmkgxpl6tw5fhb9wifsf3l/image_1c9mh9f211ibj27g1bkbiksbbrm.png
  [7]: http://static.zybuluo.com/leiming/k42l1psujv38ahx3bvpmzh7w/image_1c9mht86h4fa1g5c7a36ec1pdk13.png
  [8]: http://static.zybuluo.com/leiming/42se2e65pcjbd6hgxp3pteef/image_1c9mihif11qp71eo1ks2rrm1aai1g.png
  [9]: http://static.zybuluo.com/leiming/65nr9uni3q4lzpm505h1gt4x/image_1c9mijvolr9l174t17feoe81nr21t.png
  [10]: https://developers.weixin.qq.com/miniprogram/introduction/plugin.html#%E5%BC%80%E5%8F%91%E6%8F%92%E4%BB%B6
  [11]: http://static.zybuluo.com/leiming/3q2pwnhl3q68rk9h6kwwh83q/image_1c9mirr6917n1efj181l11vd1a2m2a.png
  [12]: https://mp.weixin.qq.com/debug/wxadoc/introduction/plugin.html
  [13]: http://www.ifanr.com/minapp/998861
