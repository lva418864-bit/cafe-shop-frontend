'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Users as UsersIcon } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { RoleGuard } from '@/components/common/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RoleBadge } from '@/features/user/components/role-badge';
import { useUsers } from '@/features/user/hooks';
import { ROUTES } from '@/constants/routes';
import { hasAnyRole } from '@/constants/roles';
import { formatDate } from '@/utils/formatDate';
import { useAuthStore } from '@/store/authStore';

const PAGE_SIZE = 10;

export default function UsersPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'staff']}>
      <UsersContent />
    </RoleGuard>
  );
}

function UsersContent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = hasAnyRole(currentUser?.role, ['admin']);

  const { data, isPending, isError, refetch } = useUsers({ page, page_size: PAGE_SIZE });

  // The backend's GET /user has no search param (verified Step 1) - same
  // honest limitation as the Products/Orders list filters: this only
  // filters the current page's already-loaded rows.
  const visibleItems = useMemo(() => {
    const items = data?.items ?? [];
    if (!search.trim()) return items;
    const needle = search.trim().toLowerCase();
    return items.filter(
      (u) => u.username.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle),
    );
  }, [data?.items, search]);

  return (
    <div>
      <PageHeader
        title="Users"
        breadcrumb={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Users' }]}
        actions={
          isAdmin && (
            <Button asChild>
              <Link href={ROUTES.USER_NEW}>
                <Plus className="h-4 w-4" />
                Create User
              </Link>
            </Button>
          )
        }
      />

      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Filter this page by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState description="Could not load users." onRetry={() => refetch()} />
      ) : visibleItems.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleItems.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <Link href={ROUTES.userDetail(u.id)} className="hover:underline">
                      {u.username}
                    </Link>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={u.role} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? 'success' : 'neutral'}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground/60 text-sm">
                    {formatDate(u.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={ROUTES.userDetail(u.id)}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data && <Pagination {...data.meta} onPageChange={setPage} className="mt-4" />}
        </>
      )}
    </div>
  );
}
