import AdminRoot, { loader as adminRootLoader } from "@/routes/AdminRoot";
import LoginPage from "@/routes/LoginPage";
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
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
];

export const router = createBrowserRouter(routes);
