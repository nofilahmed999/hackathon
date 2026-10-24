import { createSlice } from '@reduxjs/toolkit';

const employeeSlice = createSlice({
  name: 'employee',
  initialState: {
    list: [],
    total: 0,
    current: null,
  },
  reducers: {
    setEmployees(state, action) {
      state.list = action.payload.employees || action.payload;
      state.total = action.payload.total || state.list.length;
    },
    setCurrentEmployee(state, action) {
      state.current = action.payload;
    },
    clearEmployees(state) {
      state.list = [];
      state.total = 0;
      state.current = null;
    },
  },
});

export const { setEmployees, setCurrentEmployee, clearEmployees } = employeeSlice.actions;
export default employeeSlice.reducer;
