import { useState, useCallback, useEffect } from 'react';
import { WikiPage, WikiSection } from '../types';
import wikiService from '../services/wiki-service';
import { getConfigService } from '../services/config-service';
import logger from '../utils/logger';

export interface WikiData {
    [key: string]: WikiPage;
}

export const useWikiData = (isBackendConnected: boolean) => {
    const [wikiData, setWikiData] = useState<WikiData>({});
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchResults, setSearchResults] = useState<WikiPage[]>([]);
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [loadingStep, setLoadingStep] = useState<string>('');
    const [dataError, setDataError] = useState<string | null>(null);

    // --- Helper Functions ---

    const enrichPageWithSections = useCallback((page: WikiPage): WikiPage => {
        if (page.sections) return page;

        const content = page.content || '';
        const sections: WikiSection[] = [];
        const sectionRegex = /<!-- SECTION:([^:]+):([^-]+) -->([\s\S]*?)<!-- END_SECTION:\1 -->/g;
        let match;

        while ((match = sectionRegex.exec(content)) !== null) {
            const [, sectionId, sectionTitle, sectionContent] = match;
            sections.push({
                id: sectionId,
                title: sectionTitle.trim(),
                content: sectionContent.trim(),
                lastModified: page.updated_at,
                author: page.author_username || 'Unknown'
            });
        }

        if (sections.length === 0) {
            const mainContentMatch = content.match(/<!-- SECTION:main-content:([^-]+?) -->/);
            const defaultTitle = mainContentMatch ? mainContentMatch[1].trim() : 'Contenu principal';
            const defaultSection = {
                id: 'main-content',
                title: defaultTitle,
                content: content || '',
                lastModified: page.updated_at,
                author: page.author_username || 'Unknown'
            };
            sections.push(defaultSection);
        } else {
            const firstSectionMatch = content.match(/<!-- SECTION:[^:]+:[^-]+ -->/);
            if (firstSectionMatch && typeof firstSectionMatch.index === 'number' && firstSectionMatch.index > 0) {
                const mainContent = content.substring(0, firstSectionMatch.index).trim();
                if (mainContent) {
                    sections.unshift({
                        id: 'main-content',
                        title: 'Contenu principal',
                        content: mainContent,
                        lastModified: page.updated_at,
                        author: page.author_username || 'Unknown'
                    });
                }
            }
        }

        return { ...page, sections };
    }, []);

    // --- Actions ---

    const refreshWikiData = useCallback(async () => {
        if (!isBackendConnected) return;

        try {
            logger.info('🔄 Refreshing wiki data...');
            setDataLoading(true);
            setDataError(null);
            setLoadingStep('Fetching pages from server...');

            const pages = await Promise.race([
                wikiService.getAllPages(),
                new Promise<WikiPage[]>((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout getAllPages')), 8000)
                )
            ]);

            if (pages && pages.length > 0) {
                setLoadingStep(`Processing ${pages.length} pages...`);
                const wikiDataMap: WikiData = {};
                pages.forEach((page, index) => {
                    if (index % 5 === 0) {
                        setLoadingStep(`Analyzing content: ${page.title} (${index + 1}/${pages.length})`);
                    }
                    wikiDataMap[page.title] = enrichPageWithSections(page);
                });
                setWikiData(wikiDataMap);
                setLoadingStep('Finalizing interface...');
                logger.success(`✅ ${pages.length} pages loaded`);
            } else if (pages && pages.length === 0) {
                setWikiData({});
                setLoadingStep('Wiki is empty');
            } else {
                setWikiData({});
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('❌ Error loading pages', errorMessage);
            setDataError(errorMessage);
            setLoadingStep('Error: Server took too long to respond');
            setWikiData({});
        } finally {
            setDataLoading(false);
            setLoadingStep('');
        }
    }, [isBackendConnected, enrichPageWithSections]);

    const addPage = useCallback(async (title: string): Promise<string | null> => {
        try {
            const newPage = await wikiService.createPage(title, '# ' + title + '\n\nContenu de la page...', false);
            if (newPage) {
                await refreshWikiData();
                return newPage.id.toString();
            }
            return null;
        } catch (error) {
            logger.error('❌ Erreur création page', error instanceof Error ? error.message : String(error));
            return null;
        }
    }, [refreshWikiData]);

    const deletePage = useCallback(async (pageId: string): Promise<void> => {
        try {
            const success = await wikiService.deletePage(pageId);
            if (success) {
                await refreshWikiData();
            }
        } catch (error) {
            logger.error('❌ Erreur suppression page', error instanceof Error ? error.message : String(error));
        }
    }, [refreshWikiData]);

    const updatePage = useCallback(async (pageId: string, content: string): Promise<void> => {
        try {
            // Logic for section updates vs full page updates
            if (pageId.includes(':')) {
                const [pageTitle, sectionId] = pageId.split(':');
                const configService = getConfigService();
                // Fetch fresh to be safe
                const response = await fetch(configService.getApiUrl('/wiki'), {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('wiki_token')}` }
                });
                if (!response.ok) throw new Error('Fetch error');
                const freshPages = await response.json();
                const page = freshPages.find((p: WikiPage) => p.id === pageTitle);

                if (!page) throw new Error('Page not found');

                const sectionRegex = new RegExp(`(<!-- SECTION:${sectionId}:[^-]+ -->)[\\s\\S]*?(<!-- END_SECTION:${sectionId} -->)`, 'g');
                const updatedContent = page.content.replace(sectionRegex, `$1\n${content}\n$2`);

                await wikiService.updatePage(pageTitle, updatedContent);
            } else {
                await wikiService.updatePage(pageId, content);
            }
            await refreshWikiData();
        } catch (error) {
            logger.error('❌ Erreur mise à jour page', error instanceof Error ? error.message : String(error));
        }
    }, [refreshWikiData]);

    const renamePage = useCallback(async (pageId: string, newTitle: string): Promise<void> => {
        try {
            const renamedPage = await wikiService.renamePage(pageId, newTitle);
            if (renamedPage) {
                await refreshWikiData();
            }
        } catch (error) {
            logger.error('❌ Erreur renommage page', error instanceof Error ? error.message : String(error));
        }
    }, [refreshWikiData]);


    // --- Search Logic ---
    const searchInPages = useCallback((term: string): WikiPage[] => {
        if (!term || term.length < 2) return [];

        const results: WikiPage[] = [];
        const termLower = term.toLowerCase();

        for (const [, page] of Object.entries(wikiData)) {
            if (page.title.toLowerCase().includes(termLower) || page.content.toLowerCase().includes(termLower)) {
                results.push(page);
                continue;
            }
            if (page.sections?.some(s => s.title.toLowerCase().includes(termLower) || s.content.toLowerCase().includes(termLower))) {
                results.push(page);
            }
        }
        return results;
    }, [wikiData]);

    useEffect(() => {
        if (searchTerm.length >= 2) {
            setSearchResults(searchInPages(searchTerm));
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, searchInPages]);

    // --- Lifecycle ---
    useEffect(() => {
        if (isBackendConnected) {
            refreshWikiData();
        }
    }, [isBackendConnected, refreshWikiData]);

    return {
        wikiData,
        setWikiData,
        dataLoading,
        dataError,
        loadingStep,
        refreshWikiData,
        enrichPageWithSections,
        // CRUD
        addPage,
        updatePage,
        deletePage,
        renamePage,
        // Search
        searchTerm,
        setSearchTerm,
        searchResults,
        searchInPages
    };
};
