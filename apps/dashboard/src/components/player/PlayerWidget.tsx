import React from 'react';
import { motion } from 'framer-motion';
import type { Widget } from '../../stores/slideStore';

interface PlayerWidgetProps {
    widget: Widget;
}

export default function PlayerWidget({ widget }: PlayerWidgetProps) {
    const style: React.CSSProperties = {
        position: 'absolute',
        left: widget.style.left,
        top: widget.style.top,
        width: widget.style.width,
        height: widget.style.height,
        zIndex: widget.style.zIndex,
        backgroundColor: widget.style.backgroundColor,
        color: widget.style.color,
        fontSize: widget.style.fontSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: widget.style.borderRadius,
    };

    const getInitial = () => {
        switch (widget.style.animation) {
            case 'fadeIn': return { opacity: 0 };
            case 'slideUp': return { y: 50, opacity: 0 };
            case 'scaleIn': return { scale: 0.5, opacity: 0 };
            default: return {};
        }
    };

    const getAnimate = () => {
        switch (widget.style.animation) {
            case 'fadeIn': return { opacity: 1 };
            case 'slideUp': return { y: 0, opacity: 1 };
            case 'scaleIn': return { scale: 1, opacity: 1 };
            default: return {};
        }
    };

    return (
        <motion.div
            style={style as any}
            initial={getInitial()}
            animate={getAnimate()}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            {widget.type === 'text' && widget.content}
            {widget.type === 'image' && (
                widget.content ? <img src={widget.content} alt="" className="w-full h-full object-cover" /> : null
            )}
            {widget.type === 'video' && (
                <video
                    src={widget.content}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                />
            )}
            {widget.type === 'shape' && ''}
            {widget.type === 'clock' && <span className="font-mono">12:00 PM</span>}
        </motion.div>
    );
}
