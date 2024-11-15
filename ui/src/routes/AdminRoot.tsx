import { DBTablesMapContext, getTables } from "@/api/data";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useLoaderDataTyped } from "@/hooks/use-data";
import { Link, Outlet } from "react-router-dom";

export async function loader() {
  return getTables();
}

export default function AdminRoot() {
  const { tablesMap } = useLoaderDataTyped<typeof loader>();
  const tables = tablesMap ? Object.values(tablesMap) : [];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <span className="font-semibold">pgPanel</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Tables</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  {tables.map((t) => {
                    return (
                      <SidebarMenuButton key={t.name} asChild>
                        <Link to={`/${t.name}`}>
                          <span>{t.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    );
                  })}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>
      <SidebarTrigger />
      <main className="container overflow-hidden mx-auto flex flex-col min-h-screen py-10 px-4">
        <DBTablesMapContext.Provider value={tablesMap}>
          <Outlet />
        </DBTablesMapContext.Provider>
      </main>
    </SidebarProvider>
  );
}
