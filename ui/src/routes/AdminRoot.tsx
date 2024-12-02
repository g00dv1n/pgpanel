import { getTables } from "@/api/schema";
import { RowSheetProvider } from "@/components/form/RowSheet";
import { Button } from "@/components/ui/button";
import { alert, GlobalAlert } from "@/components/ui/global-alert";
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
import { PgTablesMapContext } from "@/hooks/use-tables";
import { RotateCcw, SquareTerminal, Table2Icon } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLoaderData } from "react-router";

export async function loader() {
  return getTables();
}

export function AdminRoot() {
  const loaderData = useLoaderData<typeof loader>();
  const [tablesMap, setTablesMap] = useState(loaderData.tablesMap || {});

  const tables = Object.values(tablesMap);

  const reloadTables = async () => {
    const res = await getTables({ reload: true });

    if (res.error) {
      alert.error(res.error.message);
    } else {
      setTablesMap(res.tablesMap || {});
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <NavLink className="font-semibold" to="/">
                  pgPanel
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/sql">
                  <SquareTerminal />
                  SQL Editor
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>
              <span>Tables</span>
              <Button
                className="ml-auto"
                variant="ghost"
                size="icon"
                onClick={() => reloadTables()}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  {tables.map((t) => {
                    return (
                      <SidebarMenuButton key={t.name} asChild>
                        <NavLink to={`/${t.name}`}>
                          <Table2Icon /> {t.name}
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
          <RowSheetProvider>
            <Outlet />
          </RowSheetProvider>
        </PgTablesMapContext.Provider>
      </main>
    </SidebarProvider>
  );
}
