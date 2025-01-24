import { getTables } from "@/api/schema";
import { TableSheetProvider } from "@/components/form/table-settings/TableSheet";
import { alert, GlobalAlert } from "@/components/ui/global-alert";
import { LoadingButton } from "@/components/ui/loading-button";
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
import { TablesContext } from "@/hooks/use-tables";
import { RotateCcw, SquareTerminal, Table2Icon, Upload } from "lucide-react";
import { useState, useTransition } from "react";
import { NavLink, Outlet, useLoaderData } from "react-router";

export async function loader() {
  return getTables();
}

export function AdminRoot() {
  const [isTablesReloading, startTransition] = useTransition();

  const loaderData = useLoaderData<typeof loader>();
  const [tables, setTables] = useState(loaderData.tables);

  const reloadTables = () => {
    startTransition(async () => {
      const res = await getTables({ reload: true });

      if (res.error) {
        alert.error(res.error.message);
      } else {
        setTables(res.tables);
      }
    });
  };

  const menuTables = isTablesReloading ? [] : tables.map((t) => t.name);

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
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/upload">
                  <Upload />
                  Files Upload
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>
              <span>Tables</span>
              <LoadingButton
                loading={isTablesReloading}
                className="ml-auto"
                variant="ghost"
                size="icon"
                onClick={() => reloadTables()}
              >
                <RotateCcw className="h-4 w-4" />
              </LoadingButton>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  {menuTables.map((t) => {
                    return (
                      <SidebarMenuButton key={t} asChild>
                        <NavLink to={`/${t}`}>
                          <Table2Icon /> {t}
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
        <TablesContext.Provider value={tables}>
          <TableSheetProvider>
            <Outlet />
          </TableSheetProvider>
        </TablesContext.Provider>
      </main>
    </SidebarProvider>
  );
}
