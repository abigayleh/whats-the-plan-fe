import {
  ShoppingIcon, GroceriesIcon, TravelIcon, HomeIcon, HealthIcon, FitnessIcon, WorkIcon, CelebrationIcon,
  MoneyIcon, StarIcon, GameIcon, LaptopIcon, BookIcon, CartIcon, HeartIcon, MusicIcon, FoodIcon, GiftIcon,
  CameraIcon,
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
  { key: 'money', label: 'Money', Icon: MoneyIcon },
  { key: 'star', label: 'Star', Icon: StarIcon },
  { key: 'game', label: 'Game', Icon: GameIcon },
  { key: 'laptop', label: 'Laptop', Icon: LaptopIcon },
  { key: 'book', label: 'Book', Icon: BookIcon },
  { key: 'cart', label: 'Cart', Icon: CartIcon },
  { key: 'heart', label: 'Heart', Icon: HeartIcon },
  { key: 'music', label: 'Music', Icon: MusicIcon },
  { key: 'food', label: 'Food', Icon: FoodIcon },
  { key: 'gift', label: 'Gift', Icon: GiftIcon },
  { key: 'camera', label: 'Camera', Icon: CameraIcon },
];

export function getTaskIcon(key) {
  return TASK_ICONS.find((item) => item.key === key) ?? null;
}
