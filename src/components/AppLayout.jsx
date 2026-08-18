import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import CategoryBar from "./CategoryBar";
import LocationFilter from "./LocationFilter";

// Sub-pages (detail / chat / edit / user profiles) render full-bleed with their
// own back headers, so the root TopBar and BottomNav are hidden for them.
const SUB_PAGE = /^\/(item|chat|edit|user)\/.+/;

export default function AppLayout() {
  const [locOpen, setLocOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const location = useLocation();
  const isSubPage = SUB_PAGE.test(location.pathname);
  const showCats = !isSubPage && (location.pathname === "/" || location.pathname === "/search");

  return (
    <div className="min-h-screen bg-background">
      {!isSubPage && <TopBar onOpenLocation={() => setLocOpen(true)} />}
      {showCats && <CategoryBar categories={categories} onCategoriesChange={setCategories} subcategories={subcategories} onSubcategoriesChange={setSubcategories} />}
      <main className={`max-w-5xl mx-auto px-4 pt-1 ${isSubPage ? "pb-4" : "pb-24"}`}>
        <Outlet context={{ categories, setCategories, subcategories, setSubcategories }} />
      </main>
      {!isSubPage && <BottomNav />}
      <LocationFilter open={locOpen} onClose={() => setLocOpen(false)} />
    </div>
  );
}