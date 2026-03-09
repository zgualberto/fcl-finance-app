<template>
  <q-layout view="lHh Lpr lFf">
    <q-header
      class="bg-white"
      :class="{ 'q-py-md q-px-xl': $q.screen.gt.sm, 'q-py-sm q-px-md': !$q.screen.gt.sm }"
    >
      <q-toolbar class="justify-between">
        <q-toolbar-title>
          <router-link
            :to="{ name: 'weekly_collections' }"
            class="text-h5 text-black text-weight-bold"
            style="text-decoration: none"
            >{{ applicationTitle }}</router-link
          >
        </q-toolbar-title>

        <div class="row items-center q-gutter-sm" v-if="$q.screen.gt.sm">
          <q-btn
            v-for="(link, index) in linksList"
            :key="index"
            :to="link.routeName ? { name: link.routeName } : undefined"
            no-caps
            rounded
            :class="{
              'text-black':
                link.routeName !== $router.currentRoute.value.name &&
                !isCurrentRouteInChildren(link),
            }"
            :flat="
              link.routeName !== $router.currentRoute.value.name && !isCurrentRouteInChildren(link)
            "
            :color="
              link.routeName === $router.currentRoute.value.name || isCurrentRouteInChildren(link)
                ? 'primary'
                : 'dark'
            "
            :unelevated="
              link.routeName === $router.currentRoute.value.name || isCurrentRouteInChildren(link)
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
        <q-btn v-else flat round icon="menu" class="text-black" @click="toggleLeftDrawer" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="showLeftDrawer" class="text-black">
      <q-list>
        <EssentialLink
          v-for="(link, index) in linksList"
          :key="index"
          v-bind="{
            title: link.title,
            ...(link.routeName && { routeName: link.routeName }),
            ...(link.icon && { icon: link.icon }),
            ...(link.children && { children: link.children }),
          }"
        />
      </q-list>
    </q-drawer>

    <q-page-container :class="{ 'q-my-lg': $q.screen.gt.sm, 'q-my-none': !$q.screen.gt.sm }">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { linksList } from 'src/data/links';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSettingsStore } from 'src/stores/settings-store';

import EssentialLink from 'src/components/EssentialLink.vue';

const router = useRouter();
const showLeftDrawer = ref(false);
const settingsStore = useSettingsStore();

const applicationTitle = computed(() => {
  const title = settingsStore.settingValue('application.title');
  return title?.trim() ? title : 'FCL Finance System';
});

const toggleLeftDrawer = () => {
  showLeftDrawer.value = !showLeftDrawer.value;
};

const isCurrentRouteInChildren = (link: (typeof linksList)[0]) => {
  if (!link.children || link.children.length === 0) {
    return false;
  }
  return link.children.some((child) => child.routeName === router.currentRoute.value.name);
};

onMounted(async () => {
  await settingsStore.init();
});
</script>
