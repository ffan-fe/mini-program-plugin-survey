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
    send: function(product)  {
      return this._mockSendData(product.price, 1000)
    },
    /**
     * 私有方法，只能在内部调用
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
  }

  ,
})
