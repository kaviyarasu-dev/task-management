import { Archive, MoreHorizontal, Trash2, Edit, ArchiveRestore } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Project } from '@/shared/types/entities.types';
import { ProjectFormModal } from './ProjectFormModal';
import { useUpdateProject } from '../hooks/useProjectMutations';

interface ProjectHeaderProps {
  project: Project;
  onArchive: () => void;
  onDelete: () => void;
}

export function ProjectHeader({ project, onArchive, onDelete }: ProjectHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const updateProject = useUpdateProject();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEditSubmit = (data: { name: string; description?: string; color?: string }) => {
    updateProject.mutate(
      { projectId: project._id, data },
      {
        onSuccess: () => setShowEditModal(false),
      }
    );
  };

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <div
          className="h-12 w-12 rounded-lg"
          style={{ backgroundColor: project.color || '#3498db' }}
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.isArchived && (
              <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Archived
              </span>
            )}
          </div>
          {project.description && (
            <p className="mt-1 text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-md p-2 hover:bg-muted"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-md border border-border bg-background py-1 shadow-lg">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setShowEditModal(true);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
            >
              <Edit className="h-4 w-4" />
              Edit Project
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onArchive();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
            >
              {project.isArchived ? (
                <>
                  <ArchiveRestore className="h-4 w-4" />
                  Unarchive
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  Archive
                </>
              )}
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      <ProjectFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        project={project}
        isLoading={updateProject.isPending}
      />
    </div>
  );
}
