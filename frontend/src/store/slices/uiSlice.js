import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: false,
    sidebarMobileOpen: false,
    theme: 'light',
  },
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action) {
      state.sidebarCollapsed = action.payload;
    },
    toggleMobileSidebar(state) {
      state.sidebarMobileOpen = !state.sidebarMobileOpen;
    },
    closeMobileSidebar(state) {
      state.sidebarMobileOpen = false;
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, toggleMobileSidebar, closeMobileSidebar } =
  uiSlice.actions;
export default uiSlice.reducer;
