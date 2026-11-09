'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';

import { RoleGuard } from '@/components/common/role-guard';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProduct } from '@/features/product/hooks';
import { uploadProductImage } from '@/features/product/api';
import { useCategories } from '@/features/category/hooks';
import { createProductSchema, type CreateProductFormValues } from '@/features/product/validation';
import { CustomizationGroupsForm } from '@/features/product/components/customization-form';
import { ImageUpload, type StagedImageSelection } from '@/features/product/components/image-upload';
import { ROUTES } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const methods = useForm<CreateProductFormValues>({ resolver: zodResolver(createProductSchema) });
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = methods;

  const createProduct = useCreateProduct();
  const { data: categories } = useCategories();

  const [stagedImage, setStagedImage] = useState<StagedImageSelection>({
    file: null,
    altText: '',
  });
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const watchedName = watch('name') || '';

  const onSubmit = (values: CreateProductFormValues) => {
    createProduct.mutate(
      {
        name: values.name,
        description: values.description || undefined,
        price: values.price,
        initial_stock: values.initial_stock,
        category_id: values.category_id,
        customization_groups: values.customization_groups,
      },
      {
        onSuccess: async (product) => {
          if (stagedImage.file) {
            setIsUploadingImage(true);
            setUploadProgress(0);
            const controller = new AbortController();
            abortRef.current = controller;
            try {
              await uploadProductImage(product.id, stagedImage.file, {
                altText: stagedImage.altText.trim() || product.name,
                isPrimary: true,
                replaceExisting: true,
                onProgress: (pct) => setUploadProgress(pct),
                signal: controller.signal,
              });
            } catch (err: unknown) {
              const msg =
                err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
                  ? err.message
                  : 'Product was created, but its image failed to upload.';
              toast({
                title: 'Image upload failed',
                description: msg,
                variant: 'destructive',
              });
            } finally {
              setIsUploadingImage(false);
              setUploadProgress(null);
              abortRef.current = null;
            }
          }
          router.push(ROUTES.productDetail(product.id));
        },
      },
    );
  };

  return (
    <RoleGuard allowedRoles={['admin', 'staff']}>
      <div
        data-testid="product-form-container"
        className="mx-auto w-full max-w-2xl space-y-6 px-4 sm:px-6"
      >
        <PageHeader
          title="Add Product"
          breadcrumb={[
            { label: 'Dashboard', href: ROUTES.DASHBOARD },
            { label: 'Products', href: ROUTES.PRODUCTS },
            { label: 'Add' },
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
                <Input
                  label="Initial stock"
                  type="number"
                  hint="Defaults to 0 if left blank"
                  error={errors.initial_stock?.message}
                  {...register('initial_stock')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <ImageUpload
                  defaultAltText={watchedName}
                  onPendingChange={setStagedImage}
                  externalProgress={uploadProgress}
                  onExternalCancel={() => abortRef.current?.abort()}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <CustomizationGroupsForm />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push(ROUTES.PRODUCTS)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createProduct.isPending || isUploadingImage}>
                Add Product
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </RoleGuard>
  );
}
