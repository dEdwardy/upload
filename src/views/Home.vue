<template>
  <div class="home">
    <input type="file" @change="handleFileChange" />
    <el-button @click="handleUpload">Upload</el-button>
    <el-button @click="handleUpload2">Upload2</el-button>
  </div>
</template>

<script>
//:TODO  PROMISE-LIMIT
import { encode } from "@/utils";
import axios from "axios";
import { read } from "fs";
import promiseLimit from "promise-limit";
// import async from "async";
const async = require("async");
const SIZE = 10 * 1024 * 1024; // 切片大小
// const SIZE =  1024; // 切片大小
export default {
  name: "Home",
  data() {
    return {
      file: null,
      data: [],
      hash: "",
      tasks: []
    };
  },
  methods: {
    request({ url, method = "post", data, headers = {}, requestList }) {
      return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        Object.keys(headers).forEach(key =>
          xhr.setRequestHeader(key, headers[key])
        );
        xhr.send(data);
        xhr.onload = e => {
          resolve({
            data: e.target.response
          });
        };
      });
    },
    handleFileChange(e) {
      const [file] = e.target.files;
      if (!file) return;
      this.file = file;
      console.log(this.file);
    },
    //生成切片文件
    createFileChunk(file, size = SIZE) {
      const fileChunkList = [];
      let cur = 0;
      while (file.size > cur) {
        fileChunkList.push({
          file: file.slice(cur, cur + size),
          cur
        });
        cur += size;
      }
      return fileChunkList;
    },
    //上传切片文件
    async uploadChunks() {
      const requestList = this.data
        .map(({ chunk, hash, total, index }) => {
          const formData = new FormData(); 
          let reader = new FileReader()
          read.on()
          formData.append("file", chunk);
          // formData.append("hash", hash);
          formData.append("filename", this.file.name);
          formData.append("current", index);
          formData.append("total", total);
          return { formData };
        })
        .map(({ formData }, idx) => {
          return { formData, idx };
          // return async () =>  {
          //   console.warn(idx)
          //   return await axios.post(
          //   `http://localhost:3000/files/p1/${this.file.name}-${idx}`,
          //   formData
          // ).then(res => console.log(res)).catch(e => console.warn(e))
          // }
        });
      let total = requestList.length;
      let filename = this.file.name;
      console.log(requestList);
      requestList.forEach(async ({ formData, idx }) => { 
        console.log(idx)
         await axios
          .post(
            `http://localhost:3000/files/p1/${this.file.name}-${idx}`,
            formData
          )
      });
      // let q = async.queue(( cb) => {
      //   console.log(cb)
      //   cb();
      // }, 6);
      // q.drain(() => {
      //   console.log("切片上传完毕");
      //   return axios.post("http://localhost:3000/files/p1-merge", {
      //     filename,
      //     total
      //   });
      // });
      // requestList.map( i=> q.push(i))

      // Promise.all(requestList)
      //   .then(res => {
      //     // console.log(res)
      //     let filename = this.file.name;
      //     return axios.post("http://localhost:3000/files/p1-merge", {
      //       filename,
      //       total
      //     });
      //     console.timeEnd("promise");
      //     //全部上传完毕
      //     // axios.post("http://localhost:3000/files/p1/"+)
      //   })
      //   .catch(err => {
      //     //至少有一个切片上传失败
      //     console.warn(err);
      //   });

      // await this.mergeRequest(); // 合并切片
    },
    async handleUpload2() {
      if (!this.file) return;
      let data = new FormData();
      // this.hash = encode(JSON.stringify(this.file));
      let reader = new FileReader();
      reader.readAsDataURL(this.file);
      reader.onload = async () => {
        console.warn(this);
        this.hash = reader.result;
        const fileChunkList = this.createFileChunk(this.file);
        this.data = fileChunkList.map(({ file }, index) => ({
          chunk: file,
          hash: this.hash + "-" + index,
          total: fileChunkList.length,
          index
        }));
        await this.uploadChunks();
      };

      // data.append('file',this.file)
      // data.append('hash',hash)
      // let filename =  this.file.name
      // return axios.post('http://localhost:3000/files/p1/merge',{
      //   filename
      // })
    },
    async handleUpload() {
      if (!this.file) return;
      let hash = encode(JSON.stringify(this.file));
      const fileChunkList = this.createFileChunk(this.file);
      this.data = fileChunkList.map(({ file }, index, end) => ({
        chunk: file,
        hash: hash + "-" + index,
        end
      }));
      await this.uploadChunks();
    },
    mergeRequest() {
      let hash = this.hash;
      return axios.post("http://localhost:3000/files/merge", {
        hash
      });
      // await this.request({
      //   url: "http://localhost:3000/merge",
      //   headers: { "content-type": "application/json" },
      //   data: JSON.stringify({
      //     filename: this.file.name,
      //     size: SIZE
      //   })
      // });
    }
  }
};
</script>
