import AdminLayout from "@/layout/AdminLayout";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AdminLayout />,
  },
]);
