<template>
  <div class="visual">
    <div style="height: 300px">
      <ve-heatmap
        :data="chartData"
        :visual-map="visualMap"
        :settings="chartSettings"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: "visual",
  data() {
    this.chartSettings = {
      position: "china",
      type: "map",
      geo: {
        label: {
          emphasis: {
            show: true
          }
        }
        //   itemStyle: {
        //     normal: {
        //       areaColor: '#323c48',
        //       borderColor: '#111'
        //     },
        //     emphasis: {
        //       areaColor: '#2a333d'
        //     }
        //   }
      }
    };
    this.visualMap = {
      type: "piecewise",
      min: 200,
      max: 1000,
      realtime: false,
      calculable: true,
      inRange: {
        color: [
          "#fee090",
          "#fdae61",
          "#f46d43",
          "#d73027",
          "#a50026"
        ]
      }
    };
    return {
      chartData: {
        columns: ["lat", "lng", "人数"],
        rows: [
          { lat: 115.892151, lng: 28.676493, 人数: 1000 },
          { lat: 117.000923, lng: 36.675807, 人数: 400 },
          { lat: 113.665412, lng: 34.757975, 人数: 800 },
          { lat: 114.298572, lng: 30.584355, 人数: 200 },
          { lat: 112.982279, lng: 28.19409, 人数: 100 },
          { lat: 113.280637, lng: 23.125178, 人数: 300 },
          { lat: 110.33119, lng: 20.031971, 人数: 800 },
          { lat: 104.065735, lng: 30.659462, 人数: 700 },
          { lat: 108.948024, lng: 34.263161, 人数: 300 },
          { lat: 103.823557, lng: 36.058039, 人数: 500 }
        ]
      }
    };
  },
  methods: {}
};
</script>

<style lang="scss" scoped>
.visual {
}
</style>