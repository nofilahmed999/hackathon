import { createSlice } from '@reduxjs/toolkit';

const companySlice = createSlice({
  name: 'company',
  initialState: {
    info: null,
    departments: [],
    designations: [],
    leaveTypes: [],
    holidays: [],
  },
  reducers: {
    setCompanyInfo(state, action) {
      state.info = action.payload;
    },
    setDepartments(state, action) {
      state.departments = action.payload;
    },
    setDesignations(state, action) {
      state.designations = action.payload;
    },
    setLeaveTypes(state, action) {
      state.leaveTypes = action.payload;
    },
    setHolidays(state, action) {
      state.holidays = action.payload;
    },
    clearCompany(state) {
      state.info = null;
      state.departments = [];
      state.designations = [];
      state.leaveTypes = [];
      state.holidays = [];
    },
  },
});

export const {
  setCompanyInfo,
  setDepartments,
  setDesignations,
  setLeaveTypes,
  setHolidays,
  clearCompany,
} = companySlice.actions;
export default companySlice.reducer;
