import { createSlice } from '@reduxjs/toolkit';

const payrollSlice = createSlice({
  name: 'payroll',
  initialState: {
    runs: [],
    currentRun: null,
    payslips: [],
  },
  reducers: {
    setPayrollRuns(state, action) {
      state.runs = action.payload;
    },
    setCurrentRun(state, action) {
      state.currentRun = action.payload;
    },
    setPayslips(state, action) {
      state.payslips = action.payload;
    },
    clearPayroll(state) {
      state.runs = [];
      state.currentRun = null;
      state.payslips = [];
    },
  },
});

export const { setPayrollRuns, setCurrentRun, setPayslips, clearPayroll } =
  payrollSlice.actions;
export default payrollSlice.reducer;
