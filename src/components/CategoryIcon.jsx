import {
  BadgeIndianRupee,
  BanknoteArrowDown,
  Bolt,
  BriefcaseBusiness,
  ChartLine,
  CircleDollarSign,
  CircleEllipsis,
  CircleHelp,
  Flame,
  Fuel,
  Gift,
  Handshake,
  HeartPulse,
  House,
  Landmark,
  PiggyBank,
  Plane,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  User,
  Users,
  UtensilsCrossed,
  Wallet,
  WalletCards,
} from 'lucide-react';
import clsx from 'clsx';

const ICON_MAP = {
  bolt: Bolt,
  flame: Flame,
  'shopping-cart': ShoppingCart,
  utensils: UtensilsCrossed,
  smartphone: Smartphone,
  'shopping-bag': ShoppingBag,
  plane: Plane,
  fuel: Fuel,
  'heart-pulse': HeartPulse,
  users: Users,
  user: User,
  house: House,
  landmark: Landmark,
  'badge-indian-rupee': BadgeIndianRupee,
  'line-chart': ChartLine,
  'piggy-bank': PiggyBank,
  wallet: Wallet,
  'briefcase-business': BriefcaseBusiness,
  'rotate-ccw': RotateCcw,
  gift: Gift,
  handshake: Handshake,
  'banknote-arrow-down': BanknoteArrowDown,
  'wallet-cards': WalletCards,
  'circle-ellipsis': CircleEllipsis,
  'circle-dollar-sign': CircleDollarSign,
};

export default function CategoryIcon({ icon = 'circle-dollar-sign', className, size = 16 }) {
  const Icon = ICON_MAP[icon] || CircleHelp;
  return <Icon size={size} className={clsx('shrink-0', className)} strokeWidth={2.1} />;
}

