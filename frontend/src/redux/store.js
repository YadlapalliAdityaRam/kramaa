import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import problemReducer from './slices/problemSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        problems: problemReducer
    }
});

export default store;
