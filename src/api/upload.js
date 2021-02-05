import { POST } from './index.js'

// 文件切片上传
export const uploadSlice = (sliceName, data, config = { }) => POST('files/p1/' + sliceName, data, { ...config })
// 切片合并
export const mergeSlice = (data, config = {}) => POST('files/p1-merge', data, { ...config })
//
export const exist = data => POST('files/p1-exist', data)
