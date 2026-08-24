import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <Skeleton className="h-40 w-full rounded-none" />
      <CardContent className="pt-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PostCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function CategoryCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6 text-center space-y-3">
        <Skeleton className="h-14 w-14 rounded-xl mx-auto" />
        <Skeleton className="h-4 w-20 mx-auto" />
        <Skeleton className="h-3 w-28 mx-auto" />
      </CardContent>
    </Card>
  );
}

export function DoctorCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
