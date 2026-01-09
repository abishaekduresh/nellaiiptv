import { X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div 
                ref={modalRef}
                className="bg-background-card border border-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all animate-in fade-in zoom-in-95 duration-200"
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    <button 
                        onClick={onClose}
                        className="text-text-secondary hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[80vh]">
                    {children}
                </div>
            </div>
        </div>
    );
}
