import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as loginApi, register as registerApi, googleLogin as googleLoginApi } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Hydrate from localStorage on load
        const storedToken = localStorage.getItem('saas_token');
        const storedUser = localStorage.getItem('saas_user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const saveSession = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('saas_token', authToken);
        localStorage.setItem('saas_user', JSON.stringify(userData));
    };

    const login = async (email, password) => {
        try {
            const response = await loginApi(email, password);
            if (response.status === 'success') {
                saveSession(response.data.user, response.data.token);
                return { success: true, role: response.data.user.role };
            }
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message || "An error occurred during login." };
        }
    };

    const register = async (name, email, password, orgName = null, isPublicClient = false) => {
        try {
            const response = await registerApi(name, email, password, orgName, isPublicClient);
            if (response.status === 'success') {
                return { success: true };
            }
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message || "An error occurred during registration." };
        }
    };

    const loginWithGoogle = async (credential) => {
        try {
            const response = await googleLoginApi(credential);
            if (response.status === 'success') {
                saveSession(response.data.user, response.data.token);
                return { success: true, role: response.data.user.role };
            }
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message || "An error occurred during Google authentication." };
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('saas_token');
        localStorage.removeItem('saas_user');
    };

    const updateUser = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem('saas_user', JSON.stringify(newUser));
    };

    const value = {
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        updateUser,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};
