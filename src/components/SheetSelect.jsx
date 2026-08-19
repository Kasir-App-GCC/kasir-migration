import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

// A native-looking sliding bottom-sheet replacement for raw <select> nodes.
// options: [{ value, label }]
export default function SheetSelect({ value, onChange, options, placeholder, label, buttonClassName = "" }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const title = label || placeholder || "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-muted outline-none text-start",
          buttonClassName
        )}
      >
        <span className={cn("truncate", selected ? "font-semibold" : "text-muted-foreground")}>
          {selected ? selected.label : (placeholder || "")}
        </span>
        <ChevronDown size={18} className="text-muted-foreground shrink-0" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[75vh]">
          <DrawerHeader className="pb-2 text-center">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-2 pb-6 max-h-[60vh]">
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-start text-sm font-medium transition",
                  o.value === value ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted"
                )}
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && <Check size={18} className="text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}