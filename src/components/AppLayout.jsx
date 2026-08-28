import React, { useState, useEffect, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import CategoryBar from "./CategoryBar";
import LocationFilter from "./LocationFilter";
import { useStore } from "@/lib/store";

// Sub-pages hide the root TopBar (they have their own back header).
const SUB_PAGE = /^\/(item|chat|edit|user)\/.+|^\/terms$/;
// Bottom nav stays visible on item pages so users can navigate away, but is
// hidden on chat/edit/user sub-pages (full-bleed or editor flows).
const NO_BOTTOMNAV = /^\/(chat|edit|user)\/.+|^\/terms$/;

export default function AppLayout() {
  const [locOpen, setLocOpen] = useState(false);
  const [locDefaultTab, setLocDefaultTab] = useState(null);
  const [locAutoDetect, setLocAutoDetect] = useState(false);
  const location = useLocation();
  const { locationFilter, categories, setCategories, subcategories, setSubcategories } = useStore();
  const isSubPage = SUB_PAGE.test(location.pathname);
  const noBottomNav = NO_BOTTOMNAV.test(location.pathname);
  const showCats = !isSubPage && (location.pathname === "/" || location.pathname === "/search");
  // Item pages keep the bottom nav, so content needs room for both the action bar and the nav.
  const mainPad = isSubPage ? (location.pathname.startsWith("/item/") ? "pb-36" : "pb-4") : "pb-24";

  const closeLoc = () => {
    setLocOpen(false);
    setLocDefaultTab(null);
    setLocAutoDetect(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {!isSubPage && <TopBar onOpenLocation={() => { setLocDefaultTab(null); setLocOpen(true); }} />}
      {showCats && <CategoryBar categories={categories} onCategoriesChange={setCategories} subcategories={subcategories} onSubcategoriesChange={setSubcategories} />}
      <main className={`max-w-5xl mx-auto px-4 pt-1 ${mainPad}`}>
        <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-7 h-7 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>}>
          <Outlet context={{ categories, setCategories, subcategories, setSubcategories, openLocation: () => { setLocDefaultTab("radius"); setLocAutoDetect(true); setLocOpen(true); } }} />
        </Suspense>
      </main>
      {!noBottomNav && <BottomNav />}
      <LocationFilter open={locOpen} onClose={closeLoc} defaultTab={locDefaultTab} autoDetect={locAutoDetect} />
    </div>
  );
}