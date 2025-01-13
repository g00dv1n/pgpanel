import { AdminRoot, loader as adminRootLoader } from "@/routes/AdminRoot";
import { LoginPage } from "@/routes/LoginPage";
import {
  loader as relationsLoader,
  RelationsPage,
} from "@/routes/RelationsPage";
import { loader as rowLoader, RowPage } from "@/routes/RowPage";
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
        path: ":tableName/row/:mode",
        element: <RowPage />,
        errorElement: <TablePageError />,
        loader: rowLoader,
      },
      {
        path: ":mainTableName/relations/:mainTableRowId",
        element: <RelationsPage />,
        errorElement: <TablePageError />,
        loader: relationsLoader,
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
