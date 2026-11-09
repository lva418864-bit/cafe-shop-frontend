import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import type { CreateProductFormValues, UpdateProductFormValues } from '../validation';

export function CustomizationGroupsForm() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CreateProductFormValues | UpdateProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customization_groups',
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Customizations</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              name: '',
              is_required: false,
              selection_type: 'single',
              options: [{ name: '', extra_price: 0 }],
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" /> Add Group
        </Button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="relative space-y-4 rounded-md border p-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive absolute top-2 right-2"
            onClick={() => remove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Group Name (e.g. Size)"
              {...register(`customization_groups.${index}.name` as const)}
              error={errors.customization_groups?.[index]?.name?.message}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Selection Type</label>
              <select
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                {...register(`customization_groups.${index}.selection_type` as const)}
              >
                <option value="single">Single Select</option>
                <option value="multiple">Multiple Select</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="border-border accent-roast-600 h-4 w-4 rounded"
              {...register(`customization_groups.${index}.is_required` as const)}
            />
            <span className="text-sm">Required</span>
          </div>

          <OptionsForm groupIndex={index} />
        </div>
      ))}
    </div>
  );
}

function OptionsForm({ groupIndex }: { groupIndex: number }) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CreateProductFormValues | UpdateProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `customization_groups.${groupIndex}.options` as const,
  });

  return (
    <div className="border-border mt-4 space-y-2 border-l-2 pl-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Options</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => append({ name: '', extra_price: 0 })}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Option
        </Button>
      </div>

      {fields.map((field, idx) => (
        <div key={field.id} className="flex items-start gap-2">
          <div className="flex-1">
            <Input
              placeholder="Option Name (e.g. Large)"
              {...register(`customization_groups.${groupIndex}.options.${idx}.name` as const)}
              error={errors.customization_groups?.[groupIndex]?.options?.[idx]?.name?.message}
            />
          </div>
          <div className="flex-1">
            <Input
              type="number"
              step="0.01"
              placeholder="Extra Price (e.g. 1.00)"
              {...register(
                `customization_groups.${groupIndex}.options.${idx}.extra_price` as const,
              )}
              error={
                errors.customization_groups?.[groupIndex]?.options?.[idx]?.extra_price?.message
              }
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive mt-1"
            onClick={() => remove(idx)}
            disabled={fields.length === 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
