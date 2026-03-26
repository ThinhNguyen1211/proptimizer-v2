import { NavLink } from 'react-router-dom';
import { Home, Folder, Bookmark, Plus, Settings } from 'lucide-react';

interface TemplatesSidebarProps {
  currentView: 'feed' | 'library' | 'saved';
  onCreateClick: () => void;
}

export default function TemplatesSidebar({ onCreateClick }: TemplatesSidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex-shrink-0">
      <div className="p-6 h-full flex flex-col">
        {/* Create Button */}
        <button
          onClick={onCreateClick}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00bcd4] to-[#6366f1] text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all mb-6"
        >
          <Plus className="w-5 h-5" />
          Create Template
        </button>

        {/* Navigation - Combined with Settings */}
        <nav className="space-y-2">
          <NavLink
            to="/templates"
            end
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-cyan-50 text-cyan-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span>Home Feed</span>
          </NavLink>

          <NavLink
            to="/templates/my-library"
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-cyan-50 text-cyan-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Folder className="w-5 h-5" />
            <span>My Library</span>
          </NavLink>

          <NavLink
            to="/templates/saved"
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-cyan-50 text-cyan-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Bookmark className="w-5 h-5" />
            <span>Saved</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-cyan-50 text-cyan-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* Quick Tips - Below Settings with margin */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-2">
            <p className="font-medium text-gray-600">Quick Tips</p>
            <ul className="space-y-1 leading-relaxed">
              <li>• Red heart = You liked it</li>
              <li>• Purple bookmark = You saved it</li>
              <li>• Click card to view details</li>
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}
