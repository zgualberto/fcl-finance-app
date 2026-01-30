import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: 'weekly-collections',
        name: 'admin.weekly_collections',
        component: () => import('pages/WeeklyCollectionsPage.vue'),
      },
      {
        path: 'expenses',
        name: 'admin.expenses',
        component: () => import('pages/ExpensesPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
