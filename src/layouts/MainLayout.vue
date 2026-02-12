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
            :flat="
              (link.children && link.children.length > 0) ||
              (link.routeName !== $router.currentRoute.value.name &&
                (!link.children || link.children.length === 0))
            "
            :color="
              link.routeName === $router.currentRoute.value.name &&
              (!link.children || link.children.length === 0)
                ? 'primary'
                : 'dark'
            "
            :unelevated="
              link.routeName === $router.currentRoute.value.name &&
              (!link.children || link.children.length === 0)
            "
            class="q-py-sm q-px-md text-subtitle1 text-weight-medium"
          >
            <q-icon v-if="link.icon" :name="link.icon" size="xs" class="q-mr-md" />
            {{ link.title }}
            <q-icon
              v-if="link.children && link.children.length > 0"
              name="fa-solid fa-angle-down"
              size="xs"
              class="q-ml-sm"
            />
            <q-menu v-if="link.children && link.children.length > 0" style="width: 200px">
              <q-list>
                <q-item
                  v-for="child in link.children"
                  :key="child.routeName"
                  clickable
                  :to="{ name: child.routeName }"
                >
                  <q-item-section v-if="child.icon" avatar>
                    <q-icon :name="child.icon" size="xs" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-left">{{ child.title }}</q-item-label>
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
