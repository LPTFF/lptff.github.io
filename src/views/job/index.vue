<template>
  <div>
    <div v-if="dataFromApi">
      <!-- Display the interface data here -->
      <pre>{{ dataFromApi }}</pre>
    </div>
    <div v-else>
      <!-- Loading message -->
      <p>Loading...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import axios from "axios";

// Interface to define the data structure
interface DataFromApi {
  // Define your data structure here
  // Example:
  // name: string;
  // age: number;
}

const dataFromApi = ref<DataFromApi | null>(null);

async function fetchData() {
  try {
    const response = await axios.get<DataFromApi>(
      "https://fastly.jsdelivr.net/gh/LPTFF/lptff.github.io@master/src/public/data/infzm.json"
    );
    dataFromApi.value = response.data;
    console.log("2333", response.data);
  } catch (error) {
    console.log("2333");

    console.error("Error fetching data:", error);
  }
}

// Fetch data when the component is mounted
onMounted(() => {
  fetchData();
});
</script>
