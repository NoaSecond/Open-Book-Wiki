import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useWiki } from '../../context/wiki-context';

interface SidebarFooterProps {
    appVersion: string;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ appVersion }) => {
    const { isDarkMode } = useWiki();

    return (
        <div className={`flex-shrink-0 p-4 border-t text-center ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'
            }`}>
            <a
                href="https://github.com/NoaSecond/Open-Book-Wiki"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center space-x-2 text-xs transition-colors duration-300 hover:underline ${isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                <span>Open Book Wiki</span>
                <ExternalLink className="w-3 h-3" />
            </a>
            <div className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'
                }`}>
                v{appVersion}
            </div>
        </div>
    );
};

export default SidebarFooter;
