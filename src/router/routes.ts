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
        path: 'reports/monthly',
        name: 'reports.monthly',
        component: () => import('pages/Reports/MonthlyReportsPage.vue'),
      },
      {
        path: 'reports/annual',
        name: 'reports.annual',
        component: () => import('pages/Reports/AnnualReportsPage.vue'),
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
      {
        path: 'activity-logs',
        name: 'admin.activity-logs',
        component: () => import('pages/Admin/ActivityLogsPage.vue'),
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
