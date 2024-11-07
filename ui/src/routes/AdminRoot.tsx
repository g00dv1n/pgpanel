import { DbTablesMap, DbTablesMapContext, getTables } from "@/api/admin";
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
import { Link, Outlet, useLoaderData } from "react-router-dom";

export async function loader() {
  return getTables();
}

export default function AdminRoot() {
  const tablesMap = useLoaderData() as DbTablesMap;

  return (
    <DbTablesMapContext.Provider value={tablesMap}>
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
                    {Object.values(tablesMap).map((t) => {
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
          <Outlet />
        </main>
      </SidebarProvider>
    </DbTablesMapContext.Provider>
  );
}
