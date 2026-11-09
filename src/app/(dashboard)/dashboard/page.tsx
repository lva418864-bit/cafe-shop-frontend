'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Download } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/features/dashboard/components/stat-card';
import {
  useDailySales,
  useLowStock,
  useSalesSummary,
  useTopProducts,
  useTriggerSync,
  useUsersSummary,
} from '@/features/dashboard/hooks';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { parseDecimal } from '@/lib/decimal';
import { useAuthStore } from '@/store/authStore';
import { hasAnyRole } from '@/constants/roles';
import { useToast } from '@/hooks/useToast';

function defaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toISODate(start), end: toISODate(end) };
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isStaff = hasAnyRole(user?.role, ['admin', 'staff']);

  useEffect(() => {
    if (user && !isStaff) {
      router.replace(ROUTES.PRODUCTS);
    }
  }, [user, isStaff, router]);

  if (!user || !isStaff) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Redirecting..." />
      </div>
    );
  }

  return <DashboardContent />;
}

function DashboardContent() {
  const defaults = useMemo(defaultDateRange, []);
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [threshold, setThreshold] = useState(10);
  const { toast } = useToast();

  const dateParams = { start_date: startDate, end_date: endDate };

  const sync = useTriggerSync();
  const {
    data: summary,
    isPending: summaryPending,
    isError: summaryError,
    refetch: refetchSummary,
  } = useSalesSummary(dateParams);
  const { data: dailySales, isPending: dailyPending } = useDailySales(dateParams);
  const { data: topProducts, isPending: topPending } = useTopProducts({ ...dateParams, limit: 5 });
  const { data: lowStock, isPending: lowStockPending } = useLowStock(threshold);
  const { data: userSummary, isPending: userSummaryPending } = useUsersSummary(dateParams);

  const maxDailyRevenue = Math.max(1, ...(dailySales ?? []).map((d) => parseDecimal(d.revenue)));

  const handleExport = () => {
    if (startDate > endDate) {
      toast({
        title: 'Invalid date range',
        description: 'Start date must be before or equal to end date.',
        variant: 'destructive',
      });
      return;
    }

    // Fallback client-side export since backend does not support an export endpoint
    if (!summary || !dailySales) {
      toast({
        title: 'Export failed',
        description: 'No data available to export.',
        variant: 'destructive',
      });
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Date,Revenue\n';
    dailySales.forEach((d) => {
      csvContent += `${d.day},${d.revenue}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export successful',
      description: 'Report downloaded as CSV.',
      variant: 'success',
    });
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        breadcrumb={[{ label: 'Dashboard' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExport}
              variant="outline"
              disabled={summaryPending || dailyPending}
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            <Button onClick={() => sync.mutate()} isLoading={sync.isPending} variant="outline">
              <RefreshCw className="h-4 w-4" />
              Sync now
            </Button>
          </div>
        }
      />

      <p className="text-foreground/50 mb-4 text-xs">
        report_service only ever reflects data as of the last sync - use &quot;Sync now&quot; if
        numbers look stale. Note: Backend does not natively support report file export; a basic CSV
        is generated client-side.
      </p>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Input
          label="From"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <Input
          label="Low stock threshold"
          type="number"
          min={0}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value) || 0)}
          className="w-40"
        />
      </div>

      {summaryError ? (
        <ErrorState description="Could not load reports." onRetry={() => refetchSummary()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {summaryPending ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : (
              <>
                <StatCard
                  label="Total revenue"
                  value={formatCurrency(summary?.total_revenue ?? 0)}
                />
                <StatCard label="Total orders" value={String(summary?.total_orders ?? 0)} />
                <StatCard label="Paid orders" value={String(summary?.paid_orders ?? 0)} />
                <StatCard label="Cancelled orders" value={String(summary?.cancelled_orders ?? 0)} />
                <StatCard
                  label="Avg order value"
                  value={formatCurrency(summary?.average_order_value ?? 0)}
                />
              </>
            )}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top products</CardTitle>
              </CardHeader>
              <CardContent>
                {topPending ? (
                  <Skeleton className="h-40 w-full" />
                ) : !topProducts || topProducts.length === 0 ? (
                  <EmptyState title="No sales in this range" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.map((p) => (
                        <TableRow key={p.product_id}>
                          <TableCell>{p.product_name}</TableCell>
                          <TableCell className="font-mono">{p.quantity_sold}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(p.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily sales</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyPending ? (
                  <Skeleton className="h-40 w-full" />
                ) : !dailySales || dailySales.length === 0 ? (
                  <EmptyState title="No sales in this range" />
                ) : (
                  <div className="space-y-2">
                    {dailySales.map((point) => (
                      <div key={point.day} className="flex items-center gap-3 text-sm">
                        <span className="text-foreground/60 w-24 shrink-0">
                          {formatDate(point.day)}
                        </span>
                        <div className="bg-roast-50 dark:bg-roast-900/30 h-4 flex-1 overflow-hidden rounded">
                          <div
                            className="bg-roast-500 h-full rounded"
                            style={{
                              width: `${(parseDecimal(point.revenue) / maxDailyRevenue) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-20 shrink-0 text-right font-mono text-xs">
                          {formatCurrency(point.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Low stock alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockPending ? (
                  <Skeleton className="h-32 w-full" />
                ) : !lowStock || lowStock.length === 0 ? (
                  <EmptyState
                    title="Nothing low on stock"
                    description={`Threshold: ${threshold}`}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStock.map((item) => (
                        <TableRow key={item.product_id}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {item.stock_quantity}
                            <Badge variant="warning" className="ml-2">
                              Low
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent>
                {userSummaryPending ? (
                  <Skeleton className="h-32 w-full" />
                ) : !userSummary ? (
                  <EmptyState title="No data" />
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-foreground/50">Total</p>
                        <p className="font-mono text-lg">{userSummary.total_users}</p>
                      </div>
                      <div>
                        <p className="text-foreground/50">Active</p>
                        <p className="font-mono text-lg">{userSummary.active_users}</p>
                      </div>
                      <div>
                        <p className="text-foreground/50">Inactive</p>
                        <p className="font-mono text-lg">{userSummary.inactive_users}</p>
                      </div>
                      <div>
                        <p className="text-foreground/50">New in range</p>
                        <p className="font-mono text-lg">{userSummary.new_users_in_range}</p>
                      </div>
                    </div>
                    <div className="border-border flex flex-wrap gap-2 border-t pt-3">
                      {Object.entries(userSummary.users_by_role).map(([role, count]) => (
                        <Badge key={role} variant="neutral">
                          {role}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
