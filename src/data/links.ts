import type { EssentialLinkProps } from 'components/EssentialLink.vue';

export const linksList: EssentialLinkProps[] = [
  {
    title: 'FCL Weekly Collection',
    icon: 'money',
    routeName: 'admin.weekly_collections',
  },
  {
    title: 'Expenses',
    icon: 'receipt',
    routeName: 'admin.expenses',
  },
];
