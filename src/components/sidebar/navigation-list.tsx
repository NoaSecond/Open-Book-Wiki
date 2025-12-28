import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    User as UserIcon,
    Check,
    X,
    MoreHorizontal,
    Edit3,
    Trash2
} from 'lucide-react';

import DragHandle from '../drag-handle';
import SvgIcon from '../svg-icon';
import { SidebarNavigationItem, User } from '../../types';

interface NavigationListProps {
    items: SidebarNavigationItem[];
    currentPage: string | null;
    onNavigate: (id: string) => void;
    canReorder: boolean;
    canEdit: boolean;
    onReorder: (newOrder: string[]) => void;
    onRename: (id: string, newTitle: string) => void;
    onDelete: (id: string, title: string) => void;
    user: User | null;
}

// Component for each draggable item
const SortableItem: React.FC<{
    item: SidebarNavigationItem;
    isActive: boolean;
    canEdit: boolean;
    onNavigate: (id: string) => void;
    onRename: (id: string, title: string) => void;
    onDelete: (id: string, title: string) => void;
}> = ({ item, isActive, canEdit, onNavigate, onRename, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const [isBeingEdited, setIsBeingEdited] = useState(false);
    const [editingTitle, setEditingTitle] = useState(item.label);
    const [showMenu, setShowMenu] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleSave = () => {
        if (editingTitle.trim()) {
            onRename(item.id, editingTitle.trim());
            setIsBeingEdited(false);
            setShowMenu(false);
        }
    };

    const handleCancel = () => {
        setIsBeingEdited(false);
        setEditingTitle(item.label);
        setShowMenu(false);
    };

    if (isBeingEdited) {
        return (
            <li ref={setNodeRef} style={style} className="relative">
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border border-custom-border bg-custom-surface`}>
                    <SvgIcon
                        name={item.iconName}
                        className={`w-5 h-5 flex-shrink-0 text-custom-muted`}
                    />
                    <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                        className={`flex-1 px-2 py-1 rounded border transition-colors bg-custom-bg border-custom-border text-custom-text placeholder-custom-muted`}
                        autoFocus
                    />
                    <div className="flex space-x-1">
                        <button onClick={handleSave} className="text-green-500 hover:text-green-400">
                            <Check className="w-4 h-4" />
                        </button>
                        <button onClick={handleCancel} className="text-red-500 hover:text-red-400">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </li>
        );
    }

    return (
        <li ref={setNodeRef} style={style} className="relative">
            <div className="flex items-center group">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                    <DragHandle />
                </div>

                <button
                    onClick={() => onNavigate(item.id)}
                    className={`flex-1 flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-custom-muted hover:bg-custom-surface hover:text-custom-text'
                        }`}
                >
                    <SvgIcon
                        name={item.iconName}
                        className={`w-5 h-5 ${isActive ? 'text-white' : 'text-custom-muted'}`}
                    />
                    <span className="truncate">{item.label}</span>
                </button>

                {canEdit && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={`p-1 rounded transition-colors text-custom-muted hover:text-custom-text hover:bg-custom-surface`}
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className={`absolute right-0 top-full mt-1 w-40 rounded-md shadow-lg border z-20 bg-custom-surface border-custom-border`}>
                                    <button
                                        onClick={() => setIsBeingEdited(true)}
                                        className={`w-full flex items-center space-x-2 px-3 py-2 text-sm transition-colors text-custom-muted hover:bg-custom-bg hover:text-custom-text`}
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        <span>Renommer</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onDelete(item.id, item.label);
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm transition-colors text-red-400 hover:bg-red-600 hover:text-white"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Supprimer</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
};

// Component for each static item
const StaticItem: React.FC<{
    item: SidebarNavigationItem;
    isActive: boolean;
    canEdit: boolean;
    onNavigate: (id: string) => void;
    onRename: (id: string, title: string) => void;
    onDelete: (id: string, title: string) => void;
}> = ({ item, isActive, canEdit, onNavigate, onRename, onDelete }) => {
    const [isBeingEdited, setIsBeingEdited] = useState(false);
    const [editingTitle, setEditingTitle] = useState(item.label);
    const [showMenu, setShowMenu] = useState(false);

    const handleSave = () => {
        if (editingTitle.trim()) {
            onRename(item.id, editingTitle.trim());
            setIsBeingEdited(false);
            setShowMenu(false);
        }
    };

    const handleCancel = () => {
        setIsBeingEdited(false);
        setEditingTitle(item.label);
        setShowMenu(false);
    };

    if (isBeingEdited) {
        return (
            <li className="relative">
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border border-custom-border bg-custom-surface`}>
                    <SvgIcon
                        name={item.iconName}
                        className={`w-5 h-5 flex-shrink-0 text-custom-muted`}
                    />
                    <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                        className={`flex-1 px-2 py-1 rounded border transition-colors bg-custom-bg border-custom-border text-custom-text placeholder-custom-muted`}
                        autoFocus
                    />
                    <div className="flex space-x-1">
                        <button onClick={handleSave} className="text-green-500 hover:text-green-400">
                            <Check className="w-4 h-4" />
                        </button>
                        <button onClick={handleCancel} className="text-red-500 hover:text-red-400">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </li>
        );
    }

    return (
        <li className="relative">
            <div className="flex items-center group">
                <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-custom-muted hover:bg-custom-surface hover:text-custom-text'
                        }`}
                >
                    <SvgIcon
                        name={item.iconName}
                        className={`w-5 h-5 ${isActive ? 'text-white' : 'text-custom-muted'}`}
                    />
                    <span className="truncate">{item.label}</span>
                </button>

                {canEdit && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={`p-1 rounded transition-colors text-custom-muted hover:text-custom-text hover:bg-custom-surface`}
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className={`absolute right-0 top-full mt-1 w-40 rounded-md shadow-lg border z-20 bg-custom-surface border-custom-border`}>
                                    <button
                                        onClick={() => setIsBeingEdited(true)}
                                        className={`w-full flex items-center space-x-2 px-3 py-2 text-sm transition-colors text-custom-muted hover:bg-custom-bg hover:text-custom-text`}
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        <span>Renommer</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onDelete(item.id, item.label);
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm transition-colors text-red-400 hover:bg-red-600 hover:text-white"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Supprimer</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
};


const NavigationList: React.FC<NavigationListProps> = ({
    items,
    currentPage,
    onNavigate,
    canReorder,
    canEdit,
    onReorder,
    onRename,
    onDelete,
    user
}) => {

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const ids = items.map(item => item.id);
            const oldIndex = ids.indexOf(active.id as string);
            const newIndex = ids.indexOf(over.id as string);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = [...ids];
                const [removed] = newOrder.splice(oldIndex, 1);
                newOrder.splice(newIndex, 0, removed);
                onReorder(newOrder);
            }
        }
    };

    const ProfilLink = () => (
        <li>
            <button
                onClick={() => onNavigate('profile')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${currentPage === 'profile'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-custom-muted hover:bg-custom-surface hover:text-custom-text'
                    }`}
            >
                <UserIcon className="w-5 h-5" />
                <span>Mon Profil</span>
            </button>
        </li>
    );

    if (canReorder) {
        return (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-2 mb-6">
                        {items.map(item => (
                            <SortableItem
                                key={item.id}
                                item={item}
                                isActive={currentPage === item.id}
                                canEdit={canEdit}
                                onNavigate={onNavigate}
                                onRename={onRename}
                                onDelete={onDelete}
                            />
                        ))}
                        {user && <ProfilLink />}
                    </ul>
                </SortableContext>
            </DndContext>
        );
    }

    return (
        <ul className="space-y-2 mb-6">
            {items.map(item => (
                <StaticItem
                    key={item.id}
                    item={item}
                    isActive={currentPage === item.id}
                    canEdit={canEdit}
                    onNavigate={onNavigate}
                    onRename={onRename}
                    onDelete={onDelete}
                />
            ))}
            {user && <ProfilLink />}
        </ul>
    );
};

export default NavigationList;
