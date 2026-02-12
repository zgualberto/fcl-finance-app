<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-white q-px-xl q-py-md">
      <q-toolbar class="justify-between">
        <q-toolbar-title class="text-h5 text-black text-weight-bold"
          >FCL Finance System</q-toolbar-title
        >

        <div class="row items-center q-gutter-sm">
          <q-btn
            v-for="(link, index) in linksList"
            :key="index"
            :to="link.routeName ? { name: link.routeName } : undefined"
            no-caps
            rounded
            :class="{ 'text-black': link.routeName !== $router.currentRoute.value.name }"
            :flat="link.routeName !== $router.currentRoute.value.name"
            :color="link.routeName === $router.currentRoute.value.name ? 'primary' : 'dark'"
            :unelevated="link.routeName === $router.currentRoute.value.name"
            class="q-py-sm q-px-md text-subtitle1"
          >
            <q-icon v-if="link.icon" :name="link.icon" size="sm" class="q-mr-md" />
            {{ link.title }}
            <q-menu v-if="link.children && link.children.length > 0">
              <q-list>
                <q-item
                  v-for="child in link.children"
                  :key="child.routeName"
                  clickable
                  :to="{ name: child.routeName }"
                >
                  <q-item-section v-if="child.icon" avatar>
                    <q-icon :name="child.icon" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ child.title }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container class="q-my-lg">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { linksList } from 'src/data/links';
</script>
