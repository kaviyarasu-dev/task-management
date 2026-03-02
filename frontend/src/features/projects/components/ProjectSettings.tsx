import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import type { Project } from '@/shared/types/entities.types';
import { updateProjectSchema, type UpdateProjectFormData } from '../validators/project.validators';
import { cn } from '@/shared/lib/utils';

const COLOR_OPTIONS = [
  '#3498db', '#2ecc71', '#e74c3c', '#9b59b6',
  '#f39c12', '#1abc9c', '#e67e22', '#34495e',
];

interface ProjectSettingsProps {
  project: Project;
  onUpdate: (data: UpdateProjectFormData) => void;
  isLoading?: boolean;
}

export function ProjectSettings({ project, onUpdate, isLoading }: ProjectSettingsProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateProjectFormData>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description || '',
      color: project.color || COLOR_OPTIONS[0],
    },
  });

  const selectedColor = watch('color');

  return (
    <form onSubmit={handleSubmit(onUpdate)} className="max-w-lg space-y-6">
      {/* Project Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Project Name
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className={cn(
            'mt-1 w-full rounded-md border border-border bg-background px-3 py-2',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            errors.name && 'border-destructive'
          )}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className={cn(
            'mt-1 w-full rounded-md border border-border bg-background px-3 py-2',
            'focus:outline-none focus:ring-2 focus:ring-primary/50'
          )}
          placeholder="Describe what this project is about"
        />
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium">Color</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color, { shouldDirty: true })}
              className={cn(
                'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                selectedColor === color ? 'border-foreground' : 'border-transparent'
              )}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isDirty || isLoading}
        className={cn(
          'flex items-center gap-2 rounded-md bg-primary px-4 py-2',
          'text-sm font-medium text-primary-foreground',
          'hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Changes
      </button>
    </form>
  );
}
