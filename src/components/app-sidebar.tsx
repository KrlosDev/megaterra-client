"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { Link } from "@tanstack/react-router"
import { logo } from "@/assets"
// import { NavProjects } from "@/components/nav-projects"
// import { NavSecondary } from "@/components/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  // BotIcon,
  // BookOpenIcon,
  // Settings2Icon,
  // LifeBuoyIcon,
  // SendIcon,
  // FrameIcon,
  // PieChartIcon,
  // MapIcon,
  Building2Icon,
  LayoutDashboardIcon,
  FileUser,
  TerminalSquareIcon,
} from "lucide-react"

// `title` values are i18n keys (resolved with t() in NavMain); they also serve
// as stable, non-localized keys for React lists and the open/closed sidebar state.
const data = {
  navMain: [
    {
      title: "nav.business",
      url: "#",
      icon: <LayoutDashboardIcon />,
      isActive: true,
      items: [
        {
          title: "nav.home",
          url: "/home",
        },
        {
          title: "nav.leads",
          url: "/leads",
        },
        {
          title: "nav.pipeline",
          url: "/pipeline",
        },
        {
          title: "nav.appointments",
          url: "/appointments",
        },
      ],
    },
    {
      title: "nav.realEstate",
      url: "#",
      icon: <Building2Icon />,
      items: [
        {
          title: "nav.projects",
          url: "/projects",
        },
        {
          title: "nav.inventory",
          url: "/inventory",
        },
        {
          title: "nav.quotes",
          url: "/quotes",
        },
      ],
    },
    {
      title: "nav.closing",
      url: "#",
      icon: <FileUser />,
      items: [
        {
          title: "nav.clients",
          url: "/clients",
        },
        {
          title: "nav.formalities",
          url: "/formalities",
        },
      ],
    },
    {
      title: "nav.system",
      url: "#",
      icon: <TerminalSquareIcon />,
      items: [
        {
          title: "nav.settings",
          url: "/settings",
        },
        // {
        //   title: "Team",
        //   url: "#",
        // },
        // {
        //   title: "Billing",
        //   url: "#",
        // },
        // {
        //   title: "Limits",
        //   url: "#",
        // },
      ],
    },
  ],
  // navSecondary: [
  //   {
  //     title: "Support",
  //     url: "#",
  //     icon: (
  //       <LifeBuoyIcon
  //       />
  //     ),
  //   },
  //   {
  //     title: "Feedback",
  //     url: "#",
  //     icon: (
  //       <SendIcon
  //       />
  //     ),
  //   },
  // ],
  // projects: [
  //   {
  //     name: "Design Engineering",
  //     url: "#",
  //     icon: (
  //       <FrameIcon
  //       />
  //     ),
  //   },
  //   {
  //     name: "Sales & Marketing",
  //     url: "#",
  //     icon: (
  //       <PieChartIcon
  //       />
  //     ),
  //   },
  //   {
  //     name: "Travel",
  //     url: "#",
  //     icon: (
  //       <MapIcon
  //       />
  //     ),
  //   },
  // ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/home">
                <div className="flex size-8 items-center justify-center overflow-hidden rounded-md">
                  <img
                    src={logo}
                    alt="Logo"
                    className="size-full object-cover"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Megaterra</span>
                  <span className="truncate text-xs">CRM</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
    </Sidebar>
  )
}
