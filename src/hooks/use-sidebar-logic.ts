import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWiki } from '../context/wiki-context';
import { getConfigService } from '../services/config-service';
import activityService, { ActivityLog } from '../services/activity-service';
import { SidebarNavigationItem } from '../types';

export const useSidebarLogic = () => {
    const {
        wikiData,
        addPage,
        renamePage,
        deletePage,
        reorderPages,
        setCurrentPage,
        hasPermission
    } = useWiki();

    const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
    const [appVersion, setAppVersion] = useState('...');
    const [orderUpdateTrigger, setOrderUpdateTrigger] = useState(0);

    // Modal & Edit states
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);


    // Logic for loading activities
    useEffect(() => {
        if (hasPermission('view_activity')) {
            const loadActivities = async () => {
                try {
                    const activities = await activityService.getLogs(10);
                    const recentMods = activities.filter((log: ActivityLog) =>
                        ['edit_page', 'edit_section', 'create_page', 'create_section'].includes(log.action)
                    ).slice(0, 3);
                    setRecentActivities(recentMods);
                } catch (error) {
                    console.error('Erreur lors du chargement des activités:', error);
                }
            };
            loadActivities();
        }
    }, [hasPermission]);

    // Logic for app version
    useEffect(() => {
        const configService = getConfigService();
        const version = configService.getConfig().version;
        setAppVersion(version);
    }, []);

    // Logic for Navigation Items
    const createNavigationItems = useCallback((): SidebarNavigationItem[] => {
        const items: SidebarNavigationItem[] = [];

        for (const [pageId, pageData] of Object.entries(wikiData)) {
            let iconName = 'book-open';
            if (pageData.title === 'Accueil') {
                iconName = 'home';
            }

            items.push({
                id: pageId,
                label: pageData.title,
                title: pageData.title,
                iconName: iconName
            });
        }

        try {
            const savedOrder = localStorage.getItem('wiki_pages_order');
            if (savedOrder) {
                const pageOrder = JSON.parse(savedOrder) as string[];
                const orderedItems: SidebarNavigationItem[] = [];

                pageOrder.forEach(pageId => {
                    const item = items.find(item => item.id === pageId);
                    if (item) {
                        orderedItems.push(item);
                    }
                });

                items.forEach(item => {
                    if (!pageOrder.includes(item.id)) {
                        orderedItems.push(item);
                    }
                });

                return orderedItems;
            }
        } catch (error) {
            console.warn('Erreur lors du chargement de l\'ordre des pages:', error);
        }

        return items;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wikiData, orderUpdateTrigger]);

    const dynamicNavigationItems = useMemo(() => createNavigationItems(), [createNavigationItems]);

    // Handlers
    const handleReorder = (newOrder: string[]) => {
        localStorage.setItem('wiki_pages_order', JSON.stringify(newOrder));
        setOrderUpdateTrigger(prev => prev + 1);
        reorderPages(newOrder);
    };

    const handleCreateCategory = async (name: string, availableIcons: any[], iconIndex: number) => {
        if (name.trim()) {
            const selectedIcon = availableIcons[iconIndex];
            const newPageId = await addPage(name.trim());
            if (newPageId) {
                setCurrentPage(name.trim());
            }
            console.log(`Catégorie créée: ${name.trim()} avec icône: ${selectedIcon.name}`);
            setShowAddCategoryModal(false);
        }
    };

    const handleAddCategoryClick = () => setShowAddCategoryModal(true);

    const handleRenamePage = (id: string, newTitle: string) => {
        renamePage(id, newTitle);
    };

    const handleDeletePage = (id: string, title: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la page "${title}" ? Cette action est irréversible.`)) {
            deletePage(id);
        }
    };

    return {
        appVersion,
        recentActivities,
        dynamicNavigationItems,
        handleReorder,
        // Modal State
        showAddCategoryModal,
        setShowAddCategoryModal,
        // Handlers
        handleAddCategoryClick,
        handleCreateCategory,
        // Item handlers
        handleRenamePage,
        handleDeletePage
    };
};
