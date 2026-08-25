import React, { useState, useEffect } from "react";
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
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const location = useLocation();
  const { locationFilter } = useStore();
  const isSubPage = SUB_PAGE.test(location.pathname);
  const noBottomNav = NO_BOTTOMNAV.test(location.pathname);
  const showCats = !isSubPage && (location.pathname === "/" || location.pathname === "/search");
  // Item pages keep the bottom nav, so content needs room for both the action bar and the nav.
  const mainPad = isSubPage ? (location.pathname.startsWith("/item/") ? "pb-36" : "pb-4") : "pb-24";

  // On first visit to Home with no location set (still "All cities"), auto-open
  // the location filter on the "Near Me" tab so the user picks a radius and
  // sees nearby listings. Only once per session — they can switch to "All
  // cities" or any other filter afterwards without being prompted again.
  useEffect(() => {
    if (location.pathname !== "/") return;
    if (locationFilter.mode !== "city" || locationFilter.city) return;
    if (sessionStorage.getItem("kasir_loc_prompted")) return;
    sessionStorage.setItem("kasir_loc_prompted", "1");
    setLocDefaultTab("radius");
    setLocOpen(true);
  }, [location.pathname]);

  const closeLoc = () => {
    setLocOpen(false);
    setLocDefaultTab(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {!isSubPage && <TopBar onOpenLocation={() => { setLocDefaultTab(null); setLocOpen(true); }} />}
      {showCats && <CategoryBar categories={categories} onCategoriesChange={setCategories} subcategories={subcategories} onSubcategoriesChange={setSubcategories} />}
      <main className={`max-w-5xl mx-auto px-4 pt-1 ${mainPad}`}>
        <Outlet context={{ categories, setCategories, subcategories, setSubcategories }} />
      </main>
      {!noBottomNav && <BottomNav />}
      <LocationFilter open={locOpen} onClose={closeLoc} defaultTab={locDefaultTab} />
    </div>
  );
}