import React from "react";
import { Navigate } from "react-router-dom";
import { useStore } from "@/lib/store";

export default function RequireAuth({ children }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}