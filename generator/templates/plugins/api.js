import axios from 'axios'
import mappings from './mappings'

let __match = function (path, pattern) {
  let params = []
  if (path === pattern) { // 当path与pattern完全相同时直接返回
    return { pattern, params }
  }
  let p = new RegExp(/:\w+/)
  let segs = pattern.match(p) // 匹配api path内类似:id的参数
  if (!segs) {
    return ''
  }
  let regex = ''
  segs.forEach((seg, index) => {
    regex = pattern.replace(seg, ['(', '[\\', 'w-]', '+)'].join(''))
    params.push({
      name: seg.substr(1)
    })
  })
  let p2 = new RegExp(regex)
  let matched = path.match(p2)
  if (matched === null) {
    return ''
  }
  matched = matched.slice(1)
  matched.forEach((value, index) => {
    params[index].value = value
  })
  return { pattern, params }
}

let __trans = function (fields, row) {
  let result = {}
  if (fields.length) {
    fields.forEach((column, index) => {
      result[column.name] = 0
      if (column.from instanceof Function) { // 处理function
        return column.from.call(fields, row)
      } else { // 处理字符串
        let from = column.from || column.name // 可省略from
        let f = from.split('.')
        if (row.hasOwnProperty(f[0])) {
          if (column.hasOwnProperty('fields')) { // 含有嵌套fields定义
            result[column.name] = []
            if (Array.isArray(row[from])) {
              row[from].forEach((row, i) => { // 需进入数组循环内字段
                result[column.name].push(__trans(column.fields, row))
              })
            }
          } else { // 没有嵌套fields定义, 直接复制
            // 支持点符号分隔
            let v = row
            f.forEach((seg, index) => {
              v = v[seg]
            })
            result[column.name] = v
          }
        }
      }
    })
  } else {
    result = row
  }
  return result
}

let __call = (path, options) => {
  console.info('%c$api.call==========path=' + path + '%c, options: ', 'background-color:#009688',
    'background-color:#e57373;font-weight:500', options)
  axios.defaults.baseURL = 'http://lrolap.huishoubao.com'
  let vm = this
  options = options || {}
  options.data = options.data || {}
  let request = { // 最终发出的请求数据
    method: options.method || 'get',
    url: !path.startsWith('/api') ? '/api' + path : path,
    data: {
      _head: {
        _interface: '',
        _msgType: 'request',
        _remark: '',
        _timestamps: '',
        _version: '1.0.0'
      },
      _param: {
      }
    }
  }
  let mapped = null, mappedParams = {}
  mappings.forEach(catalog => {
    catalog.apis.forEach((api) => {
      let {pattern, params} = __match(path, api.path)
      if (pattern) { // 一直匹配到最后一个
        mapped = JSON.parse(JSON.stringify(api))
        // 需要复制stringify丢失的format:function
        api.params && api.params.forEach((d, index) => {
          if (d.format) {
            mapped.data[index].format = d.format
          }
        })
        mappedParams = params
        mapped.converts = api.converts
      } // if pattern
    }) // apis.forEach
  }) // mappings.forEach
  if (options.data.order_by) {
    // 处理order_by字段, 换成后台真实字段
    if (mapped.fields) {
      let pivot = mapped.fields.find((f) => (f.pivot))
      if (pivot) {
        let field = pivot.fields.find((f) => (f.name === options.data.order_by))
        if (field && field.from) {
          options.data.order_by = field.from
        }
        options.data.order = ({desc: 1, asc: 0})[options.data.order]
      }
    }
  }
  mappedParams.forEach(p => {
    mapped.to = mapped.to.replace('$' + p.name, p.value)
    // 转换字典内原始参数
    if (mapped.params) {
      mapped.params.forEach((item, index) => {
        if (item.value === '$' + p.name) {
          request.data._param[item.name] = p.value
          mapped.params.splice(index, 1) // 删除已匹配的参数项
        }
      })
      // 处理未匹配到的项 应用default值
      // 例如处理page_no, page_size默认值
      mapped.params.forEach((item, index) => {
        if (item.value.startsWith('$') && item.default) {
        request.data._param[item.name] = item.default
        }
      })
    }
  })
  if (mapped && mapped.params) {
    Object.keys(options.data).forEach((key, index) => {
      if (options.data[key].constructor.name == 'Object') { // 支持第二层{}定义
        Object.keys(options.data[key]).forEach((kk, ii) => {
          mapped.params.forEach((d, i) => {
            if (d.value === '$' + key + '.' + kk) {
              let format = d.format || function (input) { return input }
              request.data._param[d.name] = format(options.data[key][kk])
              mapped.params.splice(i, 1)
            }
          })
        })
      } else {
        mapped.params.forEach((d, i) => {
          if (d.value === '$' + key) {
            let format = d.format || function (input) { return input }
            request.data._param[d.name] = format(options.data[key])
            delete options.data[key]
            mapped.params.splice(i, 1)
          }
        })
    }
  })
  // 复制api mappings内定义的写死参数
  mapped.params.forEach((d, index) => {
    if (typeof d.value === 'string' && d.value.startsWith('$')) {
    } else {
    request.data._param[d.name] = d.value
    }
  })
  }
  // 复制前台options.data内的其他参数
  Object.keys(options.data).forEach((key, index) => {
    request.data._param[key] = options.data[key]
  })
  console.info('(requests.data 发送真实数据)', request.data)
  if (mapped !== null) {
    request.method = mapped.method || 'get'
    request.url = mapped.to
    request.fields = mapped.fields || []
  }
  // vm.$bus.$emit('ajaxRequest')
  axios.interceptors.request.use((config) => {
    let token = localStorage.getItem('token')
    config.headers['token'] = token
    return config
  }, (err) => {
    return Promise.reject(err)
  })
  return new Promise((resolve, reject) => {
    axios(request).then(res => {
      let { data: response } = res
      setTimeout(function () {
        // vm.$bus.$emit('ajaxResponse')
      }, 500)
      // 处理后台异常
      if (response._data._errCode === 0) {
        // 后台返回正常, 处理fields mapping
        let result = __trans(request.fields, response._data._retData)
        //  field --- formatter
        if (mapped.converts) {
          result = mapped.converts.default.call(mapped, result)
        }
        resolve(result)
      } else if (response.code === -2) { // 处理后台异常
        // vm.notice('系统繁忙')
      } else if (response.code === 10) {
      } else if (response.code === 11) {
        // 登录态丢失
      } else {
        // 服务器错误
      }
    }).catch((error) => {
      reject(error)
    })
  }) // new Promise
}

Plugin.install = function(Vue, options) {
  Object.defineProperties(Vue.prototype, {
    $api: {
      get() {
        return new Vue({
          data () {
            return {
            }
          },
          methods: {
            call: __call
          }
        });
      }
    }
  });
};

Vue.use(Plugin)

export default Plugin;
