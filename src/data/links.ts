import type { EssentialLinkProps } from 'components/EssentialLink.vue';

export const linksList: EssentialLinkProps[] = [
  {
    title: 'FCL Weekly Collection',
    icon: 'fa-solid fa-dollar-sign',
    routeName: 'weekly_collections',
  },
  {
    title: 'FCL Weekly Expenses',
    icon: 'receipt',
    routeName: 'expenses',
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
