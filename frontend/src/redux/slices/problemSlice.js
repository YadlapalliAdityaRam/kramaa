import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const initialState = {
    problems: [],
    currentProblem: null,
    isLoading: false,
    error: null
};

export const fetchProblems = createAsyncThunk('problems/fetchAll', async (_, thunkAPI) => {
    try {
        const response = await api.get('/problems');
        const problems = response?.data?.problems;
        return Array.isArray(problems) ? problems : [];
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch problems');
    }
});

export const fetchProblem = createAsyncThunk('problems/fetchOne', async (id, thunkAPI) => {
    try {
        const response = await api.get(`/problems/${id}`);
        return response.data.problem;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch problem');
    }
});

export const likeProblem = createAsyncThunk('problems/like', async (id, thunkAPI) => {
    try {
        const response = await api.post(`/problems/${id}/like`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to like problem');
    }
});

export const unlikeProblem = createAsyncThunk('problems/unlike', async (id, thunkAPI) => {
    try {
        const response = await api.delete(`/problems/${id}/like`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to unlike problem');
    }
});

const problemSlice = createSlice({
    name: 'problems',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProblems.pending, (state) => { state.isLoading = true; })
            .addCase(fetchProblems.fulfilled, (state, action) => {
                state.isLoading = false;
                state.problems = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchProblems.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(fetchProblem.pending, (state) => { state.isLoading = true; })
            .addCase(fetchProblem.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentProblem = action.payload;
            })
            .addCase(fetchProblem.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(likeProblem.fulfilled, (state, action) => {
                if (state.currentProblem && state.currentProblem._id === action.meta.arg) {
                    state.currentProblem.likesCount = action.payload.likesCount;
                    state.currentProblem.hasLiked = true;
                }
            })
            .addCase(unlikeProblem.fulfilled, (state, action) => {
                if (state.currentProblem && state.currentProblem._id === action.meta.arg) {
                    state.currentProblem.likesCount = action.payload.likesCount;
                    state.currentProblem.hasLiked = false;
                }
            });
    }
});

export default problemSlice.reducer;
