<template>
  <div class="home">
    <input type="file" @change="handleFileChange" />
    <el-button @click="handleUpload">Upload</el-button>
    <el-button @click="handleUpload2">Upload2</el-button>
    <el-button @click="handleStop">Stop</el-button>
    <el-button @click="handleHash" :loading="computing">ComputeHash</el-button>
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
import { uploadSlice, mergeSlice, exist } from "@/api/upload.js";
import { source } from "@/api/index.js";
import Worker from "../worker/hash.worker";
const mapLimit = require("promise-map-limit");
const mapSeries = require("promise-map-series");
const SparkMD5 = require("spark-md5");
const async = require("async");
const mapSerires = async.mapSerires;
const SIZE = 2 * 1024 * 1024; // 切片大小 2M
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
      computing: false
    };
  },
  methods: {
    handleFileChange(e) {
      const [file] = e.target.files;
      if (!file) return;
      this.file = file;
      this.progress = 0;
    },
    //生成切片文件
    createFileChunk(file, size = SIZE) {
      const fileChunkList = [];
      let cur = 0;
      while (file.size > cur) {
        fileChunkList.push({
          file: file.slice(cur, cur + size),
          cur,
          index: Math.floor(cur / size)
        });
        cur += size;
      }
      return fileChunkList;
    },
    /**
     * file :Blob
     */
    readFile(file, type = "dataurl") {
      return new Promise((resolve, reject) => {
        let reader = new FileReader();
        if (type == "dataurl") {
          reader.readAsDataURL(file);
        } else if (type == "binarystring") {
          reader.readAsBinaryString(file);
        } else {
          reader.readAsArrayBuffer(file);
        }

        reader.onload = e => {
          resolve(e.target.result);
        };
        reader.onerror = err => {
          reject(err);
        };
      });
    },
    //上传切片文件
    async uploadChunks() {
      console.error("上传切片");
      const requestList = this.data.map(async ({ chunk, total, index }) => {
        const formData = new FormData();
        let hash = await this.computeMd5(chunk);
        formData.append("file", chunk);
        formData.append("hash", hash);
        formData.append("filename", this.file.name);
        formData.append("current", index);
        formData.append("total", total);
        // let base64 = await this.readFile(chunk);
        // console.log(base64)
        // formData.append("base64", base64);
        return { formData, idx: index, total };
      });
      let filename = this.file.name;
      // promise.all  并行但能限流  所以 引入异步流程控制的 async库 mapLimit并行 并限流
      console.log(requestList.length);
      let progressArr = [];
      mapLimit(requestList, 6, async i => {
        let { formData, idx, total } = await i;
        let res = await uploadSlice(`${this.file.name}-${idx}`, formData, {
          cancelToken: new CancelToken(c => (cancel = c))
        });
        let current = parseInt(res.data.data.current, 10) + 1;
        let progress = Number(((current / total) * 100).toFixed(2));
        progressArr.push(progress);
        this.progress = Math.max.apply(null, progressArr);
      })
        .then(() => {
          let filename = this.file.name;
          let formData = new FormData();
          formData.append("filename", filename);
          formData.append("file", this.file);
          formData.append("total", requestList.length);
          setTimeout(() => {
            mergeSlice(formData, {
            cancelToken: new CancelToken(c => (cancel = c))
          })
            .then(res => {
              this.$message({
                message: "Success",
                type: "success"
              });
            })
            .catch(e => {
              this.$message({
                message: "Fail",
                type: "error"
              });
            });
          },500)
        })
        .catch(e => console.log(e));
    },
    handleStop() {
      if (!this.file) return;
      // source.cancel('Operation canceled by the user.');
      cancel("sssss");
    },
    computeMd5(file) {
      if (!file) file = this.file;
      this.computing = true;
      return new Promise((resolve, reject) => {
        //大文件 依旧切片  生成md5
        // const size = 20 * 1024 * 1024;
        // const slices = this.createFileChunk(file, size);
        // let worker = new Worker();
        // worker.postMessage(["init"]);
        // mapLimit(slices, 1, async ({ file, index }) => {
        //   let binary = await this.readFile(file, "binarystring");
        //   worker.postMessage(["slice", binary, index, slices.length]);
        // }).then(() => {
        //   worker.postMessage(["merge"]);
        // });
        // worker.onmessage = ({ data }) => {
        //     resolve(data)
        //   if (data && data.length > 1) {
        //     let [current, total] = data;
        //     console.warn(current, total);
        //   } else {
        //     console.log(data);
        //   }
        // };

        //  小文件直接 md5 不用 分片
        let reader = new FileReader();
        reader.readAsBinaryString(file);
        reader.onload = e => {
          // console.log("读取文件");
          let worker = new Worker();
          worker.postMessage(["hash", e.target.result]);
          worker.onmessage = ({ data }) => {
            //此处即为 web worker 返回的文件md5
            resolve(data);
            this.computing = false;
          };
        };
        reader.onerror = err => {
          this.computing = false;
          reject("文件读取失败");
        };
      });
    },
    handleHash() {
      if (!this.file) return;
      this.computeMd5();
    },
    async handleUpload2() {
      if (!this.file) return;
      let data = new FormData();
      //:TODO 询问服务器是否已经上传过此文件 即 md5是否存在
      let hash = await this.computeMd5();
      let isFileExist = await exist({ hash });
      if (isFileExist && isFileExist.data && isFileExist.data.data) {
        //文件已存在
        this.progress = 100;
        return;
      }
      const fileChunkList = this.createFileChunk(this.file);
      this.data = fileChunkList.map(({ file }, index) => ({
        chunk: file,
        total: fileChunkList.length,
        index
      }));
      await this.uploadChunks();
    },
    async handleUpload() {
      if (!this.file) return;
      // let hash = encode(JSON.stringify(this.file));
      const fileChunkList = this.createFileChunk(this.file);
      this.data = fileChunkList.map(({ file }, index, end) => ({
        chunk: file,
        // hash: hash + "-" + index,
        end
      }));
      await this.uploadChunks();
    }
  }
};
</script>
