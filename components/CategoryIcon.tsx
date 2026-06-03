"use client"

import {
  Flag, Layers, Monitor, Car, Navigation, Gift, Tag, Compass,
  Star, Palette, Package, HelpCircle, ShieldCheck, Truck, Building2,
  MapPin, Snowflake, Shirt, ParkingCircle, Paintbrush, Megaphone,
  Award, LayoutGrid, Factory, Wrench, Users, Image, FileText,
  BarChart2, Store, Sun, Umbrella, Hammer, Box, Signpost, Route,
  HardDrive, Leaf, Shield, Printer, Briefcase, Zap, Globe, Camera,
  Clipboard, TreeDeciduous,
} from "lucide-react"
import type { LucideProps } from "lucide-react"

const MAP: Record<string, React.ComponentType<LucideProps>> = {
  Flag, Layers, Monitor, Car, Navigation, Gift, Tag, Compass,
  Star, Palette, Package, ShieldCheck, Truck, Building2, MapPin,
  Snowflake, Shirt, ParkingCircle, Paintbrush, Megaphone, Award,
  LayoutGrid, Factory, Wrench, Users, Image, FileText, BarChart2,
  Store, Sun, Umbrella, Hammer, Box, Signpost, Route, HardDrive,
  Leaf, Shield, Printer, Briefcase, Zap, Globe, Camera, Clipboard,
  TreeDeciduous,
}

export default function CategoryIcon({
  name,
  size = 24,
  className,
  strokeWidth,
  ...props
}: { name: string } & LucideProps) {
  const Icon = MAP[name]

  // Known Lucide component name → render the icon
  if (Icon) return <Icon size={size} strokeWidth={strokeWidth} className={className} {...props} />

  // Emoji or arbitrary text → render inline so it still looks intentional
  if (name?.trim()) {
    return (
      <span
        className={className}
        style={{ fontSize: typeof size === "number" ? size : 24, lineHeight: 1 }}
        aria-hidden
      >
        {name}
      </span>
    )
  }

  // Unknown name → question mark fallback
  return <HelpCircle size={size} strokeWidth={strokeWidth} className={className} {...props} />
}
