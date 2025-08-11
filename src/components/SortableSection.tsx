import React from 'react';
import { UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SectionDragHandle from './SectionDragHandle';

interface SortableSectionProps {
  id: UniqueIdentifier;
  children: React.ReactNode;
  isDarkMode?: boolean;
}

const SortableSection: React.FC<SortableSectionProps> = ({ id, children, isDarkMode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="absolute left-0 top-0 h-full flex items-center z-10">
        <div {...attributes} {...listeners}>
          <SectionDragHandle isDarkMode={isDarkMode} />
        </div>
      </div>
      <div className="pl-8">{children}</div>
    </div>
  );
};

export default SortableSection;
