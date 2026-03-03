// src/components/Navbar.js
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Navbar.css';
import LogoHorizontal from './assets/logo_horizontaly';

const Navbar = () => {
    const { t, i18n } = useTranslation();
    const linksContainerRef = useRef(null);
    const location = useLocation();

    const navItems = useMemo(() => ([
        { to: '/', labelKey: 'nav.home' },
        { to: '/about', labelKey: 'nav.about' },
        { to: '/experience', labelKey: 'nav.experience' },
        { to: '/skills', labelKey: 'nav.skills' },
        { to: '/portfolio', labelKey: 'nav.portfolio' },
        { to: '/contact', labelKey: 'nav.contact' },
    ]), []);

    const setPillToElement = useCallback((el) => {
        const container = linksContainerRef.current;
        if (!container || !el) return;
        const containerRect = container.getBoundingClientRect();
        const { left, width } = el.getBoundingClientRect();
        container.style.setProperty('--pill-left', `${left - containerRect.left}px`);
        container.style.setProperty('--pill-width', `${width}px`);
        container.style.setProperty('--pill-opacity', '1');
    }, []);

    const setPillToActive = useCallback(() => {
        const container = linksContainerRef.current;
        if (!container) return;
        const active = container.querySelector('a.active');
        if (active) {
            setPillToElement(active);
            try {
                active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } catch (_) {}
        } else {
            container.style.setProperty('--pill-opacity', '0');
        }
    }, [setPillToElement]);

    const handleMouseEnter = (e) => {
        const link = e.currentTarget.querySelector('a');
        if (link) setPillToElement(link);
    };

    const handleMouseLeave = () => setPillToActive();

    const handleLangChange = (newLang) => {
        if (i18n.language !== newLang) {
            void i18n.changeLanguage(newLang);
        }
    };

    useEffect(() => {
        setPillToActive();
    }, [location.pathname, setPillToActive]);

    useEffect(() => {
        const onResize = () => setPillToActive();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [setPillToActive]);

    return (
        <header className="main-header">
            <div className="header-logo">
                <NavLink to="/" className="logo-link" aria-label={t('logo.ariaLabel')}>
                    <LogoHorizontal />
                </NavLink>
            </div>

            <nav
                className="main-nav"
                ref={linksContainerRef}
                onMouseLeave={handleMouseLeave}
            >
                <ul>
                    {navItems.map((item) => (
                        <li key={item.to} onMouseEnter={handleMouseEnter}>
                            <NavLink
                                to={item.to}
                                className={({ isActive }) => (isActive ? 'active' : '')}
                                end={item.to === '/'}
                            >
                                {t(item.labelKey)}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="header-lang-switcher" data-lang={i18n.language}>
                <button
                    type="button"
                    className={i18n.language === 'pl' ? 'active' : ''}
                    onClick={() => handleLangChange('pl')}
                    aria-pressed={i18n.language === 'pl'}
                >
                    PL
                </button>
                <button
                    type="button"
                    className={i18n.language === 'en' ? 'active' : ''}
                    onClick={() => handleLangChange('en')}
                    aria-pressed={i18n.language === 'en'}
                >
                    EN
                </button>
            </div>
        </header>
    );
};

export default Navbar;