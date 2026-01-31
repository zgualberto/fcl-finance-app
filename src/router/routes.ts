import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: 'weekly-collections',
        name: 'weekly_collections',
        component: () => import('pages/WeeklyCollectionsPage.vue'),
      },
      {
        path: 'expenses',
        name: 'expenses',
        component: () => import('pages/ExpensesPage.vue'),
      },
      {
        path: 'members',
        name: 'admin.members',
        component: () => import('pages/Admin/MembersPage.vue'),
      },
      {
        path: 'categories',
        name: 'admin.categories',
        component: () => import('pages/Admin/CategoriesPage.vue'),
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
