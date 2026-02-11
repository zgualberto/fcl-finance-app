<template>
  <!-- If it has children, render as expansion item -->
  <q-expansion-item
    v-if="children && children.length > 0"
    :icon="icon"
    :label="title"
    :default-opened="false"
  >
    <q-list class="q-pl-md">
      <q-item
        v-for="child in children"
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
  </q-expansion-item>

  <!-- Otherwise, render as regular item -->
  <q-item v-else clickable :to="{ name: routeName }">
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
export interface EssentialLinkProps {
  title: string;
  caption?: string;
  routeName?: string;
  icon?: string;
  children?: {
    title: string;
    routeName: string;
    icon?: string;
  }[];
}

withDefaults(defineProps<EssentialLinkProps>(), {
  caption: '',
  routeName: '',
  icon: '',
  children: () => [],
});
</script>
