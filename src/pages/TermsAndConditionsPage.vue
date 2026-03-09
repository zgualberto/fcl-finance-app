<template>
  <div class="q-pa-md">
    <TermsAndConditionsComponent @accept="acceptTerms" @close="closeTerms" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import TermsAndConditionsComponent from 'src/components/TermsAndConditionsComponent.vue';

const router = useRouter();
const $q = useQuasar();

const acceptTerms = () => {
  $q.notify({
    type: 'positive',
    message: 'Terms and Conditions accepted',
    position: 'bottom-right',
    timeout: 2000,
  });
  void router.push({ name: 'weekly_collections' });
};

const closeTerms = () => {
  void router.back();
};
</script>
