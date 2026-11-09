'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';

import { RoleGuard } from '@/components/common/role-guard';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  useDeleteProductImage,
  useProduct,
  useUpdateProduct,
  useUpdateProductImage,
  useUploadProductImage,
} from '@/features/product/hooks';
import { useCategories } from '@/features/category/hooks';
import { updateProductSchema, type UpdateProductFormValues } from '@/features/product/validation';
import { CustomizationGroupsForm } from '@/features/product/components/customization-form';
import { ImageUpload, type StagedImageSelection } from '@/features/product/components/image-upload';
import { ROUTES } from '@/constants/routes';
import { parseDecimal } from '@/lib/decimal';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);

  const { data: product, isPending, isError, refetch } = useProduct(productId);
  const updateProduct = useUpdateProduct(productId);
  const uploadImage = useUploadProductImage(productId);
  const updateImageMeta = useUpdateProductImage(productId);
  const deleteImage = useDeleteProductImage(productId);
  const { data: categories } = useCategories();
  const [stagedImage, setStagedImage] = useState<StagedImageSelection>({
    file: null,
    altText: '',
  });

  const methods = useForm<UpdateProductFormValues>({
    resolver: zodResolver(updateProductSchema),
    values: product
      ? {
          name: product.name,
          description: product.description ?? '',
          price: parseDecimal(product.price),
          is_active: product.is_active,
          category_id: product.category_id,
          customization_groups:
            product.customization_groups?.map((g) => ({
              name: g.name,
              is_required: g.is_required,
              selection_type: g.selection_type,
              options: g.options.map((o) => ({
                name: o.name,
                extra_price: parseDecimal(o.extra_price),
              })),
            })) || [],
        }
      : undefined,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-3 px-4 sm:px-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !product) {
    return <ErrorState title="Product not found" onRetry={() => refetch()} />;
  }

  const onSubmit = (values: UpdateProductFormValues) => {
    updateProduct.mutate(
      { ...values, description: values.description || undefined },
      {
        onSuccess: async () => {
          if (stagedImage.file) {
            try {
              await uploadImage.mutateAsync({
                file: stagedImage.file,
                options: {
                  altText: stagedImage.altText.trim() || values.name,
                  isPrimary: true,
                  replaceExisting: true,
                },
              });
            } catch {
              // Toast already handled by hook
            }
          }
          router.push(ROUTES.productDetail(productId));
        },
      },
    );
  };

  const primaryImage =
    product.images?.find((img) => img.is_primary) ?? product.images?.[0] ?? null;

  return (
    <RoleGuard allowedRoles={['admin', 'staff']}>
      <div
        data-testid="product-form-container"
        className="mx-auto w-full max-w-2xl space-y-6 px-4 sm:px-6"
      >
        <PageHeader
          title={`Edit ${product.name}`}
          breadcrumb={[
            { label: 'Dashboard', href: ROUTES.DASHBOARD },
            { label: 'Products', href: ROUTES.PRODUCTS },
            { label: product.name, href: ROUTES.productDetail(product.id) },
            { label: 'Edit' },
          ]}
        />
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <Card>
              <CardContent className="space-y-4 pt-6">
                <Input label="Name" error={errors.name?.message} {...register('name')} />

                <div className="space-y-2">
                  <label className="text-sm leading-none font-medium">Category</label>
                  <select
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    {...register('category_id')}
                  >
                    <option value="">Select a category</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && (
                    <p className="text-destructive text-sm">{errors.category_id.message}</p>
                  )}
                </div>

                <Textarea
                  label="Description"
                  error={errors.description?.message}
                  {...register('description')}
                />
                <Input
                  label="Price"
                  type="number"
                  step="0.01"
                  error={errors.price?.message}
                  {...register('price')}
                />
                <label className="text-foreground flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="border-border accent-roast-600 h-4 w-4 rounded"
                    {...register('is_active')}
                  />
                  Active (visible and orderable)
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <ImageUpload
                  existingImage={primaryImage}
                  defaultAltText={product.name}
                  onPendingChange={setStagedImage}
                  onUpload={(file, opts) =>
                    uploadImage.mutateAsync({
                      file,
                      options: {
                        altText: opts.altText || product.name,
                        isPrimary: true,
                        replaceExisting: true,
                        onProgress: opts.onProgress,
                        signal: opts.signal,
                      },
                    })
                  }
                  onUpdateAltText={(imageId, altText) =>
                    updateImageMeta.mutateAsync({
                      imageId,
                      payload: { alt_text: altText },
                    })
                  }
                  onDelete={async (imageId) => {
                    await deleteImage.mutateAsync(imageId);
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <CustomizationGroupsForm />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.productDetail(productId))}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={updateProduct.isPending}>
                Save changes
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </RoleGuard>
  );
}
