import { createSlice } from '@reduxjs/toolkit';

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    todayStatus: null,
    monthly: [],
    board: [],
  },
  reducers: {
    setTodayStatus(state, action) {
      state.todayStatus = action.payload;
    },
    setMonthlyAttendance(state, action) {
      state.monthly = action.payload;
    },
    setBoard(state, action) {
      state.board = action.payload;
    },
    clearAttendance(state) {
      state.todayStatus = null;
      state.monthly = [];
      state.board = [];
    },
  },
});

export const { setTodayStatus, setMonthlyAttendance, setBoard, clearAttendance } =
  attendanceSlice.actions;
export default attendanceSlice.reducer;
