import React from 'react';
import { X, Users } from 'lucide-react';
import { AppSettings } from '../types';
import { RegisteredUsersManagement } from './RegisteredUsersManagement';

interface AdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  currentAdminEmail?: string;
}

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  currentAdminEmail
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#FDFBF7] rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-amber-400 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 bg-[#991B1B] text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-400 text-stone-950 rounded-xl shadow-xs">
              <Users className="w-5 h-5 text-stone-950" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold tracking-wide text-white">
                Registered Devotees &amp; Access Roles
              </h2>
              <p className="text-[11px] text-amber-200">
                Manage roles: Admin (all rights), Member (read-only full data), Viewer (limited statement &amp; payments)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <RegisteredUsersManagement
            settings={settings}
            onSaveSettings={onSaveSettings}
            currentAdminEmail={currentAdminEmail}
          />
        </div>
      </div>
    </div>
  );
};
