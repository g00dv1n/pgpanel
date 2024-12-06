import { AdminRoot, loader as adminRootLoader } from "@/routes/AdminRoot";
import { LoginPage } from "@/routes/LoginPage";
import { SqlPage } from "@/routes/SqlPage";
import { loader as tableLoader, TablePage } from "@/routes/TablePage";
import { TablePageError } from "@/routes/TablePageError";

import { createBrowserRouter, RouteObject } from "react-router";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <AdminRoot />,
    loader: adminRootLoader,
    hydrateFallbackElement: <></>, // @TODO render some [Loading...] element here
    children: [
      {
        path: ":tableName",
        element: <TablePage />,
        errorElement: <TablePageError />,
        loader: tableLoader,
      },
      {
        path: "sql",
        element: <SqlPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
];

export const router = createBrowserRouter(routes);
