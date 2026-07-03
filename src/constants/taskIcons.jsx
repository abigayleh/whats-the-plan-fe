import {
  ShoppingIcon, GroceriesIcon, TravelIcon, HomeIcon, HealthIcon, FitnessIcon, WorkIcon, CelebrationIcon,
} from '../components/layout/icons';

export const TASK_ICONS = [
  { key: 'shopping', label: 'Shopping', Icon: ShoppingIcon },
  { key: 'groceries', label: 'Groceries', Icon: GroceriesIcon },
  { key: 'travel', label: 'Travel', Icon: TravelIcon },
  { key: 'home', label: 'Home', Icon: HomeIcon },
  { key: 'health', label: 'Health', Icon: HealthIcon },
  { key: 'fitness', label: 'Fitness', Icon: FitnessIcon },
  { key: 'work', label: 'Work', Icon: WorkIcon },
  { key: 'celebration', label: 'Celebration', Icon: CelebrationIcon },
];

export function getTaskIcon(key) {
  return TASK_ICONS.find((item) => item.key === key) ?? null;
}
