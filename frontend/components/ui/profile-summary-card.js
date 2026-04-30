import { SectionHeader } from "@/components/section-header";
import { Card, CardContent } from "@/components/ui/card";

export function ProfileSummaryCard({ items, title }) {
  return (
    <Card>
      <CardContent className="stack-grid">
        <SectionHeader description="Core profile information in a compact operational summary." title={title} />
        <div className="list-card">
          {items.map((item) => (
            <div className="list-row" key={item.label}>
              <strong>{item.value}</strong>
              <p>{item.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
