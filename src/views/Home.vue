<template>
  <div class="home">
    <input type="file" @change="handleFileChange" />
    <el-button @click="handleUpload">Upload</el-button>
    <el-button @click="handleUpload2">Upload2</el-button>
    <el-button @click="handleStop">Stop</el-button>
    <el-progress :percentage="progress"></el-progress>
  </div>
</template>

<script>
//:TODO  PROMISE-LIMIT
import { encode } from "@/utils";
import axios from "axios";
import { read } from "fs";
import promiseLimit from "promise-limit";
// import { series, parallelLimit } from "async-es";
import { resolve } from "path";
import { uploadSlice, mergeSlice } from "@/api/upload.js";
import { source } from '@/api/index.js'
const mapLimit = require("promise-map-limit");
const mapSeries = require("promise-map-series");
const async = require('async')
const mapSerires = async.mapSerires;
const SIZE = 50 * 1024 * 1024; // 切片大小 2M
// const SIZE =  1024; // 切片大小

const CancelToken = axios.CancelToken;
let cancel;
export default {
  name: "Home",
  data() {
    return {
      file: null,
      data: [],
      hash: "",
      tasks: [],
      progress: 0,
    };
  },
  methods: {
    request({ url, method = "post", data, headers = {}, requestList }) {
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        Object.keys(headers).forEach((key) =>
          xhr.setRequestHeader(key, headers[key])
        );
        xhr.send(data);
        xhr.onload = (e) => {
          resolve({
            data: e.target.response,
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
          cur,
        });
        cur += size;
      }
      return fileChunkList;
    },
    readerFile(file) {
      return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
          resolve(e.target.result);
        };
        reader.onerror = (err) => {
          reject(err);
        };
      });
    },
    //上传切片文件
    async uploadChunks() {
      const requestList = this.data.map(
        async ({ chunk, hash, total, index }) => {
          const formData = new FormData();
          formData.append("file", chunk);
          formData.append("filename", this.file.name);
          formData.append("current", index);
          formData.append("total", total);
          // let base64 = await this.readerFile(chunk);
          // console.log(base64)
          // formData.append("base64", base64);
          return { formData, idx: index, total };
        }
      );
      let filename = this.file.name;
      // promise.all  并行但能限流  所以 引入异步流程控制的 async库 mapLimit并行 并限流
      console.log(requestList.length);
      mapLimit(requestList, 1, async (i) => {
        let { formData, idx, total } = await i;
        let res = await uploadSlice(`${this.file.name}-${idx}`, formData,{ 
          cancelToken: new CancelToken(c => cancel = c)
        });
        let current = parseInt(res.data.data.current, 10) + 1;
        let progress = (current / total) * 100;
        if (progress > this.progress) {
          console.warn(progress);
          this.progress = progress;
        }
      })
        .then(() => {
         let filename = this.file.name;
          mergeSlice({
            filename,
            total: requestList.length,
          },{ cancelToken: new CancelToken(c => cancel = c)}).then(res => {
             this.$message({
               message:'Success',
               type:'success'
             })
          }).catch(e => {
             this.$message({
              message:'Fail',
               type:'error'
             })
          })
        })
        .catch((e) => console.log(e));
    },
    handleStop(){
      if (!this.file) return;
      // source.cancel('Operation canceled by the user.');
      cancel('sssss')
    },
    async handleUpload2() {
      if (!this.file) return;
      let data = new FormData();
      // this.hash = encode(JSON.stringify(this.file));
      // let reader = new FileReader();
      // reader.readAsDataURL(this.file);
      // reader.onload = async () => {
      //   this.hash = reader.result;
      // };

      //:TODO 上传切片前 提交 文件base64 看是否已经传过文件
      const fileChunkList = this.createFileChunk(this.file);
      this.data = fileChunkList.map(({ file }, index) => ({
        chunk: file,
        // hash: this.hash + "-" + index,
        total: fileChunkList.length,
        index,
      }));
      await this.uploadChunks();

      // data.append('file',this.file)
      // data.append('hash',hash)
    },
    async handleUpload() {
      if (!this.file) return;
      // let hash = encode(JSON.stringify(this.file));
      const fileChunkList = this.createFileChunk(this.file);
      this.data = fileChunkList.map(({ file }, index, end) => ({
        chunk: file,
        // hash: hash + "-" + index,
        end,
      }));
      await this.uploadChunks();
    },
  },
};
</script>
