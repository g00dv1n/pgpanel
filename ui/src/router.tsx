import AdminRoot, { loader as adminRootLoader } from "@/routes/AdminRoot";
import LoginPage from "@/routes/LoginPage";
import { SqlPage } from "@/routes/SqlPage";
import TablePage, { loader as tableLoader } from "@/routes/TablePage";

import { createBrowserRouter, RouteObject } from "react-router";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <AdminRoot />,
    loader: adminRootLoader,
    children: [
      {
        path: ":tableName",
        element: <TablePage />,
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
