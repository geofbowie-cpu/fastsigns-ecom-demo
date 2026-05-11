import {
  Flag, Layers, Monitor, Car, Navigation, Gift, Tag,
  Compass, Star, Palette, Package, HelpCircle,
} from "lucide-react"
import type { LucideProps } from "lucide-react"

const MAP: Record<string, React.ComponentType<LucideProps>> = {
  Flag, Layers, Monitor, Car, Navigation, Gift, Tag,
  Compass, Star, Palette, Package,
}

export default function CategoryIcon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Icon = MAP[name] ?? HelpCircle
  return <Icon {...props} />
}
