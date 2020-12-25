import SparkMD5 from 'spark-md5'
self.onmessage = e => {
    console.log('recieve message from main thread')
    let { data } = e;
    let [type, buffer,current,total] = data
    //直接计算hash
    if (type == 'hash') {
        let md5 = SparkMD5.hashBinary(buffer)
        self.postMessage(md5)
    } else {
        let spark = new SparkMD5()
        //大文件 计算切片hash
        if (type == 'slice') {
            console.log('slice')
            console.log(buffer)
            self.spark.append(buffer)
            self.postMessage([current,total])
        }
        if(type == 'merge'){
            console.log('merge')
            self.spark.end()
            self.postMessage(self.spark)
            self.spark = null
        }
    }

}