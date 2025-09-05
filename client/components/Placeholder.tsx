import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Placeholder({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground">
          This page is ready for your detailed spec. Tell me what sections,
          charts, or data you want and I will build it.
        </p>
        {action ?? <Button>Describe what you want</Button>}
      </CardContent>
    </Card>
  );
}
