import {
  AdminRoot,
  loader as adminRootLoader,
} from "@/components/layout/AdminRoot";
import { LoadingFallback } from "@/components/layout/LoadingFallback";
import { BackupPage } from "@/routes/BackupPage";
import { ErrorPage } from "@/routes/ErrorPage";
import { LoginPage } from "@/routes/LoginPage";
import {
  loader as relationsLoader,
  RelationsPage,
} from "@/routes/RelationsPage";
import { loader as rowLoader, RowPage } from "@/routes/RowPage";
import { SqlPage } from "@/routes/SqlPage";
import { loader as tableLoader, TablePage } from "@/routes/TablePage";
import { loader as filesLoader, UploadPage } from "@/routes/UploadPage";

import { createBrowserRouter, RouteObject } from "react-router";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <AdminRoot />,
    loader: adminRootLoader,
    hydrateFallbackElement: <LoadingFallback />,
    children: [
      {
        path: ":tableName",
        element: <TablePage />,
        errorElement: <ErrorPage />,
        loader: tableLoader,
      },
      {
        path: ":tableName/row/:mode",
        element: <RowPage />,
        errorElement: <ErrorPage />,
        loader: rowLoader,
      },
      {
        path: ":mainTableName/relations",
        element: <RelationsPage />,
        errorElement: <ErrorPage />,
        loader: relationsLoader,
      },
      {
        path: "sql",
        element: <SqlPage />,
      },
      {
        path: "files",
        element: <UploadPage />,
        loader: filesLoader,
      },
      {
        path: "backup",
        element: <BackupPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
];

export const router = createBrowserRouter(routes);
