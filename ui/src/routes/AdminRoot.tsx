import { PgTablesMapContext, getTables } from "@/api/data";
import { GlobalAlert } from "@/components/ui/global-alert";
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
import { NavLink, Outlet, useLoaderData } from "react-router";

export async function loader() {
  return getTables();
}

export default function AdminRoot() {
  const { tablesMap = {} } = useLoaderData<typeof loader>();
  const tables = Object.values(tablesMap);

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
                        <NavLink to={`/${t.name}`}>
                          <span>{t.name}</span>
                        </NavLink>
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
        <GlobalAlert />
        <PgTablesMapContext.Provider value={tablesMap}>
          <Outlet />
        </PgTablesMapContext.Provider>
      </main>
    </SidebarProvider>
  );
}
