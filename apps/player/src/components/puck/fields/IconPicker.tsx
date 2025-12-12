import React, { useState } from 'react';
import { FieldLabel } from '@measured/puck';
import * as Popover from '@radix-ui/react-popover';
import {
    FaHome, FaUser, FaCog, FaSearch, FaEnvelope, FaPhone, FaMapMarkerAlt,
    FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube,
    FaArrowRight, FaArrowLeft, FaCheck, FaTimes, FaInfoCircle, FaExclamationTriangle,
    FaCalendar, FaClock, FaCamera, FaVideo, FaMusic, FaFile,
    FaShoppingCart, FaCreditCard, FaMoneyBill, FaTag, FaGift,
    FaStar, FaHeart, FaThumbsUp, FaComment, FaShare,
    FaBuilding, FaStore, FaUtensils, FaCoffee, FaBeer,
    FaPlane, FaCar, FaBus, FaBicycle, FaWalking
} from 'react-icons/fa';

const ICONS: Record<string, React.ElementType> = {
    FaHome, FaUser, FaCog, FaSearch, FaEnvelope, FaPhone, FaMapMarkerAlt,
    FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube,
    FaArrowRight, FaArrowLeft, FaCheck, FaTimes, FaInfoCircle, FaExclamationTriangle,
    FaCalendar, FaClock, FaCamera, FaVideo, FaMusic, FaFile,
    FaShoppingCart, FaCreditCard, FaMoneyBill, FaTag, FaGift,
    FaStar, FaHeart, FaThumbsUp, FaComment, FaShare,
    FaBuilding, FaStore, FaUtensils, FaCoffee, FaBeer,
    FaPlane, FaCar, FaBus, FaBicycle, FaWalking
};

interface IconPickerProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    readOnly?: boolean;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, label, readOnly }) => {
    const [search, setSearch] = useState('');
    const SelectedIcon = ICONS[value] || FaHome;

    const filteredIcons = Object.keys(ICONS).filter(name =>
        name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-2">
            {label && <FieldLabel label={label} />}
            <Popover.Root>
                <Popover.Trigger asChild>
                    <button
                        className="flex items-center justify-between w-full border border-gray-200 rounded-md px-3 py-2 text-sm hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                        disabled={readOnly}
                    >
                        <div className="flex items-center gap-2">
                            <SelectedIcon className="text-gray-600" />
                            <span className="text-gray-700">{value || 'Select Icon'}</span>
                        </div>
                        <span className="text-xs text-gray-400">▼</span>
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content className="z-[9999] bg-white p-3 rounded-xl shadow-xl border border-gray-100 w-64 animate-in fade-in zoom-in duration-200" sideOffset={5}>
                        <input
                            type="text"
                            placeholder="Search icons..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {filteredIcons.map(name => {
                                const Icon = ICONS[name];
                                return (
                                    <button
                                        key={name}
                                        onClick={() => onChange(name)}
                                        className={`p-2 rounded hover:bg-indigo-50 flex items-center justify-center transition-colors ${value === name ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600'}`}
                                        title={name}
                                    >
                                        <Icon />
                                    </button>
                                );
                            })}
                        </div>
                        <Popover.Arrow className="fill-white" />
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );
};
