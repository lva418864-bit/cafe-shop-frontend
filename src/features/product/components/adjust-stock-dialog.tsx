'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select';
import { useAdjustStock } from '@/features/product/hooks';
import { adjustStockSchema, type AdjustStockFormValues } from '@/features/product/validation';

export interface AdjustStockDialogProps {
  productId: number;
  productName: string;
  currentStock: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REASON_OPTIONS = [
  { label: 'Restock', value: 'restock' },
  { label: 'Manual adjustment', value: 'adjustment' },
];

export function AdjustStockDialog({
  productId,
  productName,
  currentStock,
  open,
  onOpenChange,
}: AdjustStockDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: { reason: 'restock' },
  });

  const adjustStock = useAdjustStock(productId);
  const reason = watch('reason');

  const onSubmit = (values: AdjustStockFormValues) => {
    adjustStock.mutate(
      {
        change_quantity: values.change_quantity,
        reason: values.reason,
        reference: values.reference || undefined,
      },
      {
        onSuccess: () => {
          reset({ reason: 'restock' });
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            &quot;{productName}&quot; currently has{' '}
            <span className="font-mono">{currentStock}</span> in stock.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Quantity change"
            type="number"
            hint="Positive to add stock, negative to remove it"
            error={errors.change_quantity?.message}
            {...register('change_quantity')}
          />
          <SelectField
            label="Reason"
            options={REASON_OPTIONS}
            value={reason}
            onValueChange={(value) => setValue('reason', value as AdjustStockFormValues['reason'])}
            error={errors.reason?.message}
          />
          <Input
            label="Reference"
            hint="Optional - e.g. a supplier delivery note"
            error={errors.reference?.message}
            {...register('reference')}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={adjustStock.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
