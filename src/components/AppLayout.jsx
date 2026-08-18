import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import CategoryBar from "./CategoryBar";
import LocationFilter from "./LocationFilter";

// Sub-pages hide the root TopBar (they have their own back header).
const SUB_PAGE = /^\/(item|chat|edit|user)\/.+/;
// Bottom nav stays visible on item pages so users can navigate away, but is
// hidden on chat/edit/user sub-pages (full-bleed or editor flows).
const NO_BOTTOMNAV = /^\/(chat|edit|user)\/.+/;

export default function AppLayout() {
  const [locOpen, setLocOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const location = useLocation();
  const isSubPage = SUB_PAGE.test(location.pathname);
  const noBottomNav = NO_BOTTOMNAV.test(location.pathname);
  const showCats = !isSubPage && (location.pathname === "/" || location.pathname === "/search");
  // Item pages keep the bottom nav, so content needs room for both the action bar and the nav.
  const mainPad = isSubPage ? (location.pathname.startsWith("/item/") ? "pb-36" : "pb-4") : "pb-24";

  return (
    <div className="min-h-screen bg-background">
      {!isSubPage && <TopBar onOpenLocation={() => setLocOpen(true)} />}
      {showCats && <CategoryBar categories={categories} onCategoriesChange={setCategories} subcategories={subcategories} onSubcategoriesChange={setSubcategories} />}
      <main className={`max-w-5xl mx-auto px-4 pt-1 ${mainPad}`}>
        <Outlet context={{ categories, setCategories, subcategories, setSubcategories }} />
      </main>
      {!noBottomNav && <BottomNav />}
      <LocationFilter open={locOpen} onClose={() => setLocOpen(false)} />
    </div>
  );
}