import AdminRoot, { loader as adminRootLoader } from "@/routes/AdminRoot";
import TablePage from "@/routes/TablePage";

import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AdminRoot />,
    loader: adminRootLoader,
    children: [
      {
        path: ":tableName",
        element: <TablePage />,
      },
    ],
  },
]);
