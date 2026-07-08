import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useSidebarStore } from "@/stores/sidebar-store"
import { ChevronRightIcon } from "lucide-react"
import {Link} from '@tanstack/react-router'
import { useTranslation } from "react-i18next"

type NavItem = {
  title: string
  url: string
  icon: React.ReactNode
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

export function NavMain({ items }: { items: NavItem[] }) {
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) =>
          isCollapsed && item.items?.length ? (
            <CollapsedNavItem key={item.title} item={item} />
          ) : (
            <ExpandedNavItem key={item.title} item={item} />
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function ExpandedNavItem({ item }: { item: NavItem }) {
  const { t } = useTranslation()
  const openItems = useSidebarStore((state) => state.openItems)
  const setItemOpen = useSidebarStore((state) => state.setItemOpen)
  const isOpen = openItems[item.title] ?? item.isActive ?? false

  return (
    <Collapsible
      asChild
      className="group/collapsible"
      open={isOpen}
      onOpenChange={(open) => setItemOpen(item.title, open)}
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={t(item.title)}>
            {item.icon}
            <span>{t(item.title)}</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {item.items?.length ? (
          <>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton asChild>
                      <Link to={subItem.url}>
                        <span>{t(subItem.title)}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </>
        ) : null}
      </SidebarMenuItem>
    </Collapsible>
  )
}

function CollapsedNavItem({ item }: { item: NavItem }) {
  const { t } = useTranslation()
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip={t(item.title)}>
            {item.icon}
            <span>{t(item.title)}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          className="min-w-48 rounded-lg"
        >
          <DropdownMenuLabel>{t(item.title)}</DropdownMenuLabel>
          {item.items?.map((subItem) => (
            <DropdownMenuItem key={subItem.title} asChild>
              <Link to={subItem.url}>
                <span>{t(subItem.title)}</span>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
