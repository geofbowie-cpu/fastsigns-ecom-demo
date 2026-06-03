"use client"

import {
  Flag, Layers, Monitor, Car, Navigation, Gift, Tag, Compass,
  Star, Palette, Package, ShieldCheck, Truck, Building2, MapPin,
  Snowflake, Shirt, ParkingCircle, Paintbrush, Megaphone, Award,
  LayoutGrid, Factory, Wrench, Users, Image, FileText, BarChart2,
  Store, Sun, Umbrella, Hammer, Box, Signpost, Route, HardDrive,
  Leaf, Shield, Printer, Briefcase, Zap, Globe, Camera, Clipboard,
} from "lucide-react"

export const ICON_OPTIONS: { name: string; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }[] = [
  { name: "Package",       label: "Package",    Icon: Package },
  { name: "Tag",           label: "Tag",        Icon: Tag },
  { name: "Layers",        label: "Layers",     Icon: Layers },
  { name: "Flag",          label: "Flag",       Icon: Flag },
  { name: "Signpost",      label: "Signpost",   Icon: Signpost },
  { name: "MapPin",        label: "Location",   Icon: MapPin },
  { name: "Navigation",    label: "Wayfinding", Icon: Navigation },
  { name: "Route",         label: "Route",      Icon: Route },
  { name: "Compass",       label: "Compass",    Icon: Compass },
  { name: "Building2",     label: "Building",   Icon: Building2 },
  { name: "Store",         label: "Store",      Icon: Store },
  { name: "Factory",       label: "Factory",    Icon: Factory },
  { name: "Monitor",       label: "Display",    Icon: Monitor },
  { name: "Printer",       label: "Print",      Icon: Printer },
  { name: "Image",         label: "Graphics",   Icon: Image },
  { name: "Paintbrush",    label: "Design",     Icon: Paintbrush },
  { name: "Palette",       label: "Colour",     Icon: Palette },
  { name: "Camera",        label: "Photo",      Icon: Camera },
  { name: "ShieldCheck",   label: "Safety",     Icon: ShieldCheck },
  { name: "Shield",        label: "Compliance", Icon: Shield },
  { name: "Zap",           label: "Hazard",     Icon: Zap },
  { name: "Truck",         label: "Vehicle",    Icon: Truck },
  { name: "Car",           label: "Car",        Icon: Car },
  { name: "ParkingCircle", label: "Parking",    Icon: ParkingCircle },
  { name: "Snowflake",     label: "Cold",       Icon: Snowflake },
  { name: "Leaf",          label: "Seasonal",   Icon: Leaf },
  { name: "Sun",           label: "Outdoor",    Icon: Sun },
  { name: "Umbrella",      label: "Weather",    Icon: Umbrella },
  { name: "Gift",          label: "Promo",      Icon: Gift },
  { name: "Star",          label: "Featured",   Icon: Star },
  { name: "Award",         label: "Award",      Icon: Award },
  { name: "Shirt",         label: "Apparel",    Icon: Shirt },
  { name: "Briefcase",     label: "Corporate",  Icon: Briefcase },
  { name: "Users",         label: "People",     Icon: Users },
  { name: "Megaphone",     label: "Marketing",  Icon: Megaphone },
  { name: "Globe",         label: "Global",     Icon: Globe },
  { name: "BarChart2",     label: "Analytics",  Icon: BarChart2 },
  { name: "Clipboard",     label: "Checklist",  Icon: Clipboard },
  { name: "FileText",      label: "Documents",  Icon: FileText },
  { name: "LayoutGrid",    label: "Grid",       Icon: LayoutGrid },
  { name: "Hammer",        label: "Install",    Icon: Hammer },
  { name: "Wrench",        label: "Service",    Icon: Wrench },
  { name: "HardDrive",     label: "Digital",    Icon: HardDrive },
  { name: "Box",           label: "Box",        Icon: Box },
]

export default function IconPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (name: string) => void
}) {
  return (
    <div className="grid grid-cols-6 gap-1 p-2 border border-gray-200 rounded-lg bg-white max-h-52 overflow-y-auto">
      {ICON_OPTIONS.map(({ name, label, Icon }) => (
        <button
          key={name}
          type="button"
          title={label}
          onClick={() => onChange(name)}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-md transition-colors text-center ${
            value === name
              ? "bg-blue-600 text-white"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <Icon size={16} strokeWidth={1.75} />
          <span className="text-[9px] leading-tight truncate w-full">{label}</span>
        </button>
      ))}
    </div>
  )
}
