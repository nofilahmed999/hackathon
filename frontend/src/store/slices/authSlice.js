import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    profile: null,
    isAuthenticated: false,
  },
  reducers: {
    setProfile(state, action) {
      state.profile = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearProfile(state) {
      state.profile = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setProfile, clearProfile } = authSlice.actions;
export default authSlice.reducer;
