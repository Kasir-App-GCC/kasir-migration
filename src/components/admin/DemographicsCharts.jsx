import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useStore } from "@/lib/store";
import { AGE_RANGES, GENDERS } from "@/lib/demographics";

const AGE_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"];
const GENDER_COLORS = ["#8b5cf6", "#ec4899"];

function ChartCard({ title, data, colors, total, ar }) {
  const hasData = total > 0;
  return (
    <div className="rounded-2xl bg-muted/40 p-4">
      <h4 className="text-sm font-bold mb-2 text-center">{title}</h4>
      {hasData ? (
        <div className="relative" style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n) => [`${v} (${total ? Math.round((v / total) * 100) : 0}%)`, n]}
                contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold">{total}</span>
            <span className="text-[10px] text-muted-foreground">{ar ? "الإجمالي" : "Total"}</span>
          </div>
        </div>
      ) : (
        <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground">
          {ar ? "لا توجد بيانات" : "No data"}
        </div>
      )}
      <div className="mt-3 space-y-1.5">
        {data.map((d, i) => {
          const pct = total ? Math.round((d.value / total) * 100) : 0;
          return (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors[i % colors.length] }} />
              <span className="flex-1 truncate">{d.name}</span>
              <span className="font-semibold">{d.value}</span>
              <span className="text-muted-foreground w-9 text-end">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DemographicsCharts({ stats }) {
  const { lang } = useStore();
  const ar = lang === "ar";

  const ageData = AGE_RANGES.map((o) => ({
    name: ar ? o.ar : o.en,
    value: stats.ageBuckets[o.id] || 0,
  })).filter((d) => d.value > 0);

  const genderData = GENDERS.map((o) => ({
    name: ar ? o.ar : o.en,
    value: stats.genderBuckets[o.id] || 0,
  })).filter((d) => d.value > 0);

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4">
      <h3 className="font-bold text-sm mb-3">{ar ? "الديموغرافيا" : "Demographics"}</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <ChartCard title={ar ? "الفئة العمرية" : "Age Range"} data={ageData} colors={AGE_COLORS} total={stats.users} ar={ar} />
        <ChartCard title={ar ? "الجنس" : "Gender"} data={genderData} colors={GENDER_COLORS} total={stats.users} ar={ar} />
      </div>
    </div>
  );
}