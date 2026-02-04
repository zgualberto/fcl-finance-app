import type { EssentialLinkProps } from 'components/EssentialLink.vue';

export const linksList: EssentialLinkProps[] = [
  {
    title: 'FCL Weekly Collection',
    icon: 'money',
    routeName: 'weekly_collections',
  },
  {
    title: 'Expenses',
    icon: 'receipt',
    routeName: 'expenses',
  },
  {
    title: 'Reports',
    icon: 'fa-solid fa-chart-line',
    routeName: 'reports',
  },
];
