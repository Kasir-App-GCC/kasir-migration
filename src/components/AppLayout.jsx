import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import CategoryBar from "./CategoryBar";
import LocationFilter from "./LocationFilter";

export default function AppLayout() {
  const [locOpen, setLocOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const location = useLocation();
  const showCats = location.pathname === "/" || location.pathname === "/search";

  return (
    <div className="min-h-screen bg-background">
      <TopBar onOpenLocation={() => setLocOpen(true)} />
      {showCats && <CategoryBar value={category} onChange={setCategory} />}
      <main className="max-w-5xl mx-auto px-4 pt-1 pb-24">
        <Outlet context={{ category, setCategory }} />
      </main>
      <BottomNav />
      <LocationFilter open={locOpen} onClose={() => setLocOpen(false)} />
    </div>
  );
}