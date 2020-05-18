<template>
  <div class="home">
    <input type="file" @change="handleFileChange" />
    <el-button @click="handleUpload">Upload</el-button>
  </div>
</template>

<script>
const SIZE = 10 * 1024 * 1024; // 切片大小
export default {
  name: "Home",
  data() {
    return {
      container: {
        file: null,
      },
      data: [],
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
      this.container.file = file;
      console.log(this.container.file);
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
          formData.append("filename", this.container.file.name);
          return { formData };
        })
        .map(async ({ formData }) => {
          this.request({
            url: "http://localhost:3000/post",
            data: formData,
          });
        });
      await Promise.all(requestList); //并发切片

      await this.mergeRequest(); // 合并切片
    },
    async handleUpload() {
      if (!this.container.file) return;
      const fileChunkList = this.createFileChunk(this.container.file);
      this.data = fileChunkList.map(({ file }, index) => ({
        chunk: file,
        hash: this.container.file.name + "-" + index,
      }));
      await this.uploadChunks();
    },
    async mergeRequest() {
      await this.request({
        url: "http://localhost:3000/merge",
        headers: { "content-type": "application/json" },
        data: JSON.stringify({
          filename: this.container.file.name,
          size: SIZE,
        }),
      });
    },
  },
};
</script>
