import React from 'react';
import './SplashScreen.css';
import { FaFillDrip } from 'react-icons/fa';

const SplashScreen = () => {
    return (
        <div className="splash-container">
            <div className="splash-content">
                <div className="splash-logo">
                    <FaFillDrip className="milk-icon" />
                    <div className="milk-filling"></div>
                </div>
                <h1 className="splash-title">DSMS</h1>
                <p className="splash-subtitle">Dairy Society Management System</p>
                <div className="loading-bar-container">
                    <div className="loading-bar"></div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
