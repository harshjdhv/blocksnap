import { AppSidebar } from "@/components/app-sidebar"
import { InfiniteCanvas } from "@/components/infinite-canvas"
import {
    SidebarInset,
    SidebarProvider,
} from "@workspace/ui/components/sidebar"

export default function Page() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <div className="flex min-h-0 flex-1">
                    <InfiniteCanvas />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
