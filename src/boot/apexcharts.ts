import { defineBoot } from '#q-app/wrappers';
import VueApexCharts from 'vue3-apexcharts';
import ApexCharts from 'apexcharts';

declare module 'vue' {
  interface ComponentCustomProperties {
    $apexcharts: typeof ApexCharts;
  }
}

export default defineBoot(({ app }) => {
  // Register VueApexCharts globally
  // This makes the <apexchart> component available everywhere
  app.use(VueApexCharts);

  // Add $apexcharts reference to global properties for Vue instance access
  app.config.globalProperties.$apexcharts = ApexCharts;
});

export { ApexCharts };
