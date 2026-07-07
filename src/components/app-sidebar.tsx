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

const data = {
  navMain: [
    {
      title: "Business",
      url: "#",
      icon: <LayoutDashboardIcon />,
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "/home",
        },
        {
          title: "Leads",
          url: "/leads",
        },
        {
          title: "Pipeline",
          url: "/pipeline",
        },
        {
          title: "Appointments",
          url: "/appointments",
        },
      ],
    },
    {
      title: "Real Estate",
      url: "#",
      icon: <Building2Icon />,
      items: [
        {
          title: "Projects",
          url: "/projects",
        },
        {
          title: "Inventory",
          url: "/inventory",
        },
        {
          title: "Quotes",
          url: "/quotes",
        },
      ],
    },
    {
      title: "Closing",
      url: "#",
      icon: <FileUser />,
      items: [
        {
          title: "Clients",
          url: "/clients",
        },
        {
          title: "Formalities",
          url: "/formalities",
        },
      ],
    },
    {
      title: "System",
      url: "#",
      icon: <TerminalSquareIcon />,
      items: [
        {
          title: "Settings",
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
