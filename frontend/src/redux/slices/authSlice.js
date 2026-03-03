import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import {
    broadcastLogoutToOtherTabs,
    clearLegacyUnscopedEditorDrafts
} from '../../utils/sessionIsolation';

// Get user from localStorage
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

const extractApiErrorMessage = (error, fallbackMessage) => {
    const responseData = error?.response?.data;
    const validationErrors = Array.isArray(responseData?.errors) ? responseData.errors : [];
    if (validationErrors.length > 0) {
        return validationErrors
            .map((entry) => String(entry?.message || '').trim())
            .filter(Boolean)
            .join(' ');
    }

    return (
        responseData?.message ||
        error?.message ||
        fallbackMessage
    );
};

const initialState = {
    user: user || null,
    token: token || null,
    isLoading: !!token,
    error: null,
    registerMessage: null,
    isAuthenticated: !!token
};

export const register = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
    try {
        const response = await api.post('/auth/register', userData);
        if (response.data.success && response.data.token && response.data.user) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    } catch (error) {
        const message = extractApiErrorMessage(error, 'Registration failed.');
        return thunkAPI.rejectWithValue(message);
    }
});

export const login = createAsyncThunk('auth/login', async (userData, thunkAPI) => {
    try {
        const response = await api.post('/auth/login', userData);
        if (response.data.success) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    } catch (error) {
        const message = extractApiErrorMessage(error, 'Login failed.');
        return thunkAPI.rejectWithValue(message);
    }

});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, thunkAPI) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return thunkAPI.rejectWithValue('No active session');
        }

        const response = await api.get('/auth/me');
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(extractApiErrorMessage(error, 'Session expired'));
    }
});

export const logout = createAsyncThunk('auth/logout', async () => {
    try {
        await api.post('/auth/logout');
    } catch {
        // best-effort logout; local session is always cleared below
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        clearLegacyUnscopedEditorDrafts();
        broadcastLogoutToOtherTabs();
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; },
        clearRegisterMessage: (state) => { state.registerMessage = null; }
    },
    extraReducers: (builder) => {
        builder
            .addCase(register.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.registerMessage = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.error = null;

                if (action.payload.token && action.payload.user) {
                    state.isAuthenticated = true;
                    state.user = action.payload.user;
                    state.token = action.payload.token;
                    state.registerMessage = null;
                    return;
                }

                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                state.registerMessage = action.payload.message || 'Registration successful. Please verify your email.';
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                state.registerMessage = null;
            })
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.registerMessage = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(loadUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(loadUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
            })
            .addCase(loadUser.rejected, (state) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                clearLegacyUnscopedEditorDrafts();
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.registerMessage = null;
            });
    }
});

export const { clearError, clearRegisterMessage } = authSlice.actions;
export default authSlice.reducer;
