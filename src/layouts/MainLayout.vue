<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="rounded-borders">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="fa-solid fa-bars"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> FCL Finance Portal </q-toolbar-title>
        <q-spacer></q-spacer>
        <q-btn flat round icon="fa-solid fa-gear" aria-label="Settings">
          <q-menu>
            <q-list style="min-width: 250px">
              <q-item
                clickable
                v-close-popup
                class="row items-center"
                :to="{ name: 'admin.categories' }"
              >
                <q-icon name="fa-solid fa-list"></q-icon>
                <q-item-section class="text-center text-subtitle1">Categories</q-item-section>
              </q-item>
              <q-item
                clickable
                v-close-popup
                class="row items-center"
                :to="{ name: 'admin.members' }"
              >
                <q-icon name="fa-solid fa-user-cog"></q-icon>
                <q-item-section class="text-center text-subtitle1">Members</q-item-section>
              </q-item>
              <!-- activity logs -->
              <q-item
                clickable
                v-close-popup
                class="row items-center"
                :to="{ name: 'admin.activity-logs' }"
              >
                <q-icon name="fa-solid fa-bug"></q-icon>
                <q-item-section class="text-center text-subtitle1">Activity Logs</q-item-section>
              </q-item>
              <!-- backup -->
              <!-- <q-item clickable v-close-popup class="row items-center">
                <q-icon name="fa-solid fa-database"></q-icon>
                <q-item-section class="text-center text-subtitle1">Backup</q-item-section>
              </q-item> -->
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list class="q-pt-xl">
        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import EssentialLink from 'components/EssentialLink.vue';
import { linksList } from 'src/data/links';

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
