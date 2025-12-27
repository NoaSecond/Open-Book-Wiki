import React from 'react';
import { User, Clock } from 'lucide-react';
import { useWiki } from '../../context/wiki-context';
import activityService, { ActivityLog } from '../../services/activity-service';

interface ActivityListProps {
    recentActivities: ActivityLog[];
}

const ActivityList: React.FC<ActivityListProps> = ({ recentActivities }) => {
    const { isDarkMode, hasPermission } = useWiki();

    if (!hasPermission('view_activity')) {
        return null;
    }

    return (
        <div className={`mt-8 p-4 rounded-lg transition-colors duration-300 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
            }`}>
            <h3 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                Dernières modifications
            </h3>
            <div className="space-y-2">
                {recentActivities.map((log: ActivityLog) => (
                    <div key={log.id} className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'
                        }`}>
                        <div className="flex items-center space-x-1">
                            <span className="text-sm">{activityService.getActionIcon(log.action)}</span>
                            <span className={`transition-colors duration-300 ${isDarkMode ? 'text-slate-300' : 'text-gray-800'
                                }`}>
                                {activityService.formatAction(log.action)}
                            </span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                            <User className="w-3 h-3" />
                            <span>{log.username}</span>
                        </div>
                        {log.target && (
                            <div className={`truncate transition-colors duration-300 ${isDarkMode ? 'text-slate-300' : 'text-gray-800'
                                }`}>
                                {log.target}
                            </div>
                        )}
                        <div className="flex items-center space-x-1 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(log.timestamp).toLocaleDateString('fr-FR')}</span>
                        </div>
                    </div>
                ))}
                {recentActivities.length === 0 && (
                    <div className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'
                        }`}>
                        Aucune modification récente
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityList;
