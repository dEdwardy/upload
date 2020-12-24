import axios from 'axios';

let CancelToken = axios.CancelToken;
let source = CancelToken.source()
const service = axios.create({
    baseURL:'http://localhost:3000/',
    timeout:20000,
    cancelToken:source.token

})
service.interceptors.request.use(config => {
    config.meta = { startTime: new Date()}
    return config
},err => {
    console.log('1')
    return  Promise.reject(err)
})
service.interceptors.response.use(res => {
    res.config.meta.endTime = new Date();
    res.config.meta.duration = res.config.meta.endTime - res.config.meta.startTime;
    console.log('duration = '+res.config.meta.duration)
    return res
})
 const GET =  (url,params) => service.get(url,params)
 const POST =  (url,data,config = {}) => service.post(url,data,config)
 const PUT =  (url,data) => service.put(url,data)
 const DELETE =  (url,data) => service.delete(url,data)
export  {
    source,
    GET,
    POST,
    PUT,
    DELETE
}