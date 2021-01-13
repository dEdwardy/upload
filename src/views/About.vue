<template>
  <div class="about">
    <vue-record-video :mode="recMode" @stream="onStream" @result="onResult" />
    <vue-record-audio :mode="recMode" @stream="onStream2" @result="onResult2" />
    <video v-if="src" :src="src" controls="controls"></video>
    <audio  v-if="src2" :src="src2" controls="controls"></audio>
  </div>
</template>
<script>
export default {
  data(){
    return {
      // recMode:'hold',
      recMode:'press',
      src:'',
      src2:''
    }
  },
  methods:{
    onStream(stream){
      console.log(stream)
    },
    onResult(data){
      console.log('The blob data:', data);
      this.src=  window.URL.createObjectURL(data)
      console.log('Downloadable audio', window.URL.createObjectURL(data));
    },
    onStream2(stream){
      console.log(stream)
    },
    onResult2(data){
      console.log('The blob data:', data);
      this.src2=  window.URL.createObjectURL(data)
      console.log('Downloadable audio', window.URL.createObjectURL(data));
    }
  }
}
</script>
<style lang="scss" scoped>

</style>