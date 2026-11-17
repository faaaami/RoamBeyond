import {
  Camera,
  Files,
  House,
  Inbox,
  LayoutDashboard,
  Luggage,
  Menu,
  MapPin,
  MessageSquareQuote,
  Scale,
  Search,
  Settings,
  Tags,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Icon names sent by the backend's section registry (apps/admin_api/sections.py). */
const ICONS: Record<string, LucideIcon> = {
  camera: Camera,
  files: Files,
  house: House,
  inbox: Inbox,
  luggage: Luggage,
  menu: Menu,
  "map-pin": MapPin,
  "message-square-quote": MessageSquareQuote,
  scale: Scale,
  search: Search,
  settings: Settings,
  tags: Tags,
  "user-cog": UserCog,
  users: Users,
};

export function sectionIcon(name: string): LucideIcon {
  return ICONS[name] ?? LayoutDashboard;
}
