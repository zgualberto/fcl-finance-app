<template>
  <q-card
    class="rounded-borders"
    :class="{ 'q-ma-sm q-pa-lg': $q.screen.width > $q.screen.height, 'q-pa-md': $q.screen.lt.sm }"
  >
    <div class="row full-width q-mb-md items-start">
      <div class="col">
        <div class="text-h5 text-weight-bold">Year-over-year comparison</div>
        <div class="text-body1 text-grey-7">Annual trend analysis</div>
      </div>
      <div class="col-auto">
        <div class="row q-col-gutter-sm">
          <div class="col-auto">
            <q-btn
              color="positive"
              icon="download"
              label="Download Report"
              unelevated
              rounded
              class="report-filter-button"
              no-caps
            />
          </div>
        </div>
      </div>
    </div>
  </q-card>
</template>

<script lang="ts" setup></script>
