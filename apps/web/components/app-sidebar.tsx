"use client"

import * as React from "react"

import { Sidebar } from "@workspace/ui/components/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return <Sidebar variant="inset" {...props} />
}
