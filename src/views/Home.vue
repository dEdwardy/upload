<template>
  <div class="home">
    <input type="file" @change="handleFileChange" />
    <el-button @click="handleUpload">Upload</el-button>
    <el-button @click="handleUpload2">Upload2</el-button>
  </div>
</template>

<script>
import { encode } from '@/utils'
import axios from 'axios'
// const SIZE = 10 * 1024 * 1024; // 切片大小
const SIZE =  1024; // 切片大小
export default {
  name: "Home",
  data() {
    return {
      file:null,
      data: []
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
        fileChunkList.push({ file: file.slice(cur, cur + size) });
        cur += size;
      }
      return fileChunkList;
    },
    //上传切片文件
    async uploadChunks() {
      const requestList = this.data
        .map(({ chunk, hash }) => {
          const formData = new FormData();
          formData.append("chunk", chunk);
          formData.append("hash", hash);
          formData.append("filename", this.file.name);
          return { formData };
        })
        .map(async ({ formData }) => {
          axios.post('http://localhost:3000/files/v2',data)
        });
      await Promise.all(requestList); //并发切片

      await this.mergeRequest(); // 合并切片
    },
    handleUpload2(){
      if (!this.file) return;
      let data = new FormData();
      let hash = encode(JSON.stringify(this.file))
      data.append('file',this.file)
      data.append('hash',hash)
      return axios.post('http://localhost:3000/files/v2',data)
    },
    async handleUpload() {
      if (!this.file) return;
      let hash = encode(JSON.stringify(this.file))
      const fileChunkList = this.createFileChunk(this.file);
      this.data = fileChunkList.map(({ file }, index) => ({
        chunk: file,
        hash: hash+ "-" + index
      }));
      await this.uploadChunks();
    },
    async mergeRequest() {
      await this.request({
        url: "http://localhost:3000/merge",
        headers: { "content-type": "application/json" },
        data: JSON.stringify({
          filename: this.file.name,
          size: SIZE
        })
      });
    }
  }
};
</script>
