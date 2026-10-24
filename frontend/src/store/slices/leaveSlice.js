import { createSlice } from '@reduxjs/toolkit';

const leaveSlice = createSlice({
  name: 'leave',
  initialState: {
    balances: [],
    requests: [],
    allRequests: [],
  },
  reducers: {
    setLeaveBalances(state, action) {
      state.balances = action.payload;
    },
    setLeaveRequests(state, action) {
      state.requests = action.payload;
    },
    setAllLeaveRequests(state, action) {
      state.allRequests = action.payload;
    },
    clearLeave(state) {
      state.balances = [];
      state.requests = [];
      state.allRequests = [];
    },
  },
});

export const { setLeaveBalances, setLeaveRequests, setAllLeaveRequests, clearLeave } =
  leaveSlice.actions;
export default leaveSlice.reducer;
