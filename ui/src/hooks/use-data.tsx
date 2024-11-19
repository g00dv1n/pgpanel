import { PgTablesMapContext } from "@/api/data";
import { useContext } from "react";
import { useLoaderData } from "react-router-dom";

export function useLoaderDataTyped<T extends (...args: any) => Promise<any>>() {
  return useLoaderData() as Awaited<ReturnType<T>>;
}

export function useTablesMap() {
  return useContext(PgTablesMapContext);
}
