import SparkMD5 from 'spark-md5'
let spark;
self.onmessage = e => {
    console.log('recieve message from main thread')
    let { data } = e;
    let [type, buffer,current,total] = data
    //直接计算hash
    if (type == 'hash') {
        let md5 = SparkMD5.hashBinary(buffer)
        self.postMessage(md5)
    } else {
        // :TODO大文件 计算切片hash (还有点问题)
        if(type == 'init') {
            console.warn('init --------------------------')
            spark = new SparkMD5();
        }
        if (type == 'slice') {
            console.warn(`slice -----------------------${current}`)
            // console.log('slice')
            console.warn(`before--------------------`)
            console.warn(spark)
            spark.append(buffer)
            console.warn(`after--------------------`)
            console.log(spark)
            self.postMessage([current,total])
        }
        if(type == 'merge'){
            console.warn(`merge ---------------------------`)
            // console.log('merge')
            let res = spark.end()
            self.postMessage([res])
            spark = null;
        }
    }
}