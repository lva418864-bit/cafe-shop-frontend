'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { RoleGuard } from '@/components/common/role-guard';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/features/category/hooks';
import type { CategoryResponse } from '@/features/category/types';
import { ROUTES } from '@/constants/routes';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(255).optional().or(z.literal('')),
});
type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
  const { data: categories, isPending, isError, refetch } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryResponse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  const openCreateDialog = () => {
    setEditingCategory(null);
    reset({ name: '', description: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (category: CategoryResponse) => {
    setEditingCategory(category);
    reset({ name: category.name, description: category.description || '' });
    setDialogOpen(true);
  };

  const onSubmit = (values: CategoryFormValues) => {
    if (editingCategory) {
      updateCategory.mutate(
        { id: editingCategory.id, payload: values },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      createCategory.mutate(values, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <RoleGuard allowedRoles={['admin', 'staff']}>
      <PageHeader
        title="Categories"
        breadcrumb={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Categories' }]}
        actions={<Button onClick={openCreateDialog}>Add Category</Button>}
      />

      {isPending ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState description="Could not load categories." onRetry={() => refetch()} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground py-8 text-center">
                      No categories found.
                    </TableCell>
                  </TableRow>
                )}
                {categories?.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">{category.description}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-brick-600"
                        onClick={() => setDeleteTarget(category)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Name" error={errors.name?.message} {...register('name')} />
            <Textarea
              label="Description"
              error={errors.description?.message}
              {...register('description')}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createCategory.isPending || updateCategory.isPending}
              >
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete category?"
        description={deleteTarget ? `Category "${deleteTarget.name}" will be removed.` : undefined}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteCategory.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteCategory.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
    </RoleGuard>
  );
}
