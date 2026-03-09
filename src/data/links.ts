import type { EssentialLinkProps } from 'components/EssentialLink.vue';

export const linksList: EssentialLinkProps[] = [
  {
    title: 'Collections',
    icon: 'fa-solid fa-wallet',
    children: [
      {
        title: 'YTD Collections',
        icon: 'fa-solid fa-calendar',
        routeName: 'ytd_collections',
      },
      {
        title: 'Collections',
        icon: 'fa-solid fa-money-bills',
        routeName: 'weekly_collections',
      },
      {
        title: 'Expenses',
        icon: 'fa-solid fa-file-invoice-dollar',
        routeName: 'expenses',
      },
    ],
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
        title: 'Backups',
        icon: 'fa-solid fa-box-archive',
        routeName: 'admin.backups',
      },
      {
        title: 'Application Settings',
        icon: 'fa-solid fa-gear',
        routeName: 'admin.settings',
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
  {
    title: 'T&C',
    icon: 'fa-solid fa-file-contract',
    routeName: 'terms-and-conditions',
  },
];
