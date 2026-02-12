import type { EssentialLinkProps } from 'components/EssentialLink.vue';

export const linksList: EssentialLinkProps[] = [
  {
    title: 'Collection',
    icon: 'fa-solid fa-house',
    routeName: 'weekly_collections',
  },
  {
    title: 'Expenses',
    icon: 'fa-solid fa-file-invoice-dollar',
    routeName: 'expenses',
  },
  {
    title: 'Management',
    icon: 'fa-solid fa-cogs',
    children: [
      {
        title: 'Members',
        icon: 'fa-solid fa-users',
        routeName: 'admin.members',
      },
      {
        title: 'Categories',
        icon: 'fa-solid fa-tags',
        routeName: 'admin.categories',
      },
      {
        title: 'Activity Logs',
        icon: 'fa-solid fa-list',
        routeName: 'admin.activity-logs',
      },
    ],
  },
  {
    title: 'Reports',
    icon: 'fa-solid fa-chart-line',
    children: [
      {
        title: 'Monthly Report',
        icon: 'fa-solid fa-calendar-days',
        routeName: 'reports.monthly',
      },
      {
        title: 'Annual Report',
        icon: 'fa-solid fa-calendar',
        routeName: 'reports.annual',
      },
    ],
  },
];
