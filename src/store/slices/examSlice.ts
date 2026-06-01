// src/store/slices/examSlice.ts
import type { RootState } from "@/src/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  timeTaken: number; // giây
  rank: number;
}

export interface AnswerRecord {
  questionId: string;
  selectedOptionId: string;
  isCorrect?: boolean;
}

export type ExamStatus = "idle" | "joining" | "waiting" | "live" | "finished";

interface ExamState {
  examId: string | null;
  roomCode: string | null;
  status: ExamStatus;
  /** Thời gian còn lại (giây) */
  timeLeft: number;
  /** Tổng thời gian thi (giây) */
  totalTime: number;
  /** Index câu hỏi hiện tại */
  currentQuestionIndex: number;
  /** Map questionId → answerId đã chọn */
  answers: Record<string, string>;
  /** Kết quả sau khi finish */
  score: number | null;
  totalQuestions: number | null;
  correctCount: number | null;
  breakdown: AnswerRecord[];
  leaderboard: LeaderboardEntry[];
  /** Lỗi kết nối / server */
  error: string | null;
}

// ─── Initial state ────────────────────────────────────────────────────────────
const initialState: ExamState = {
  examId: null,
  roomCode: null,
  status: "idle",
  timeLeft: 0,
  totalTime: 0,
  currentQuestionIndex: 0,
  answers: {},
  score: null,
  totalQuestions: null,
  correctCount: null,
  breakdown: [],
  leaderboard: [],
  error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────
const examSlice = createSlice({
  name: "exam",
  initialState,
  reducers: {
    /** Bắt đầu join phòng thi */
    joinExam(
      state,
      action: PayloadAction<{ examId: string; roomCode?: string }>
    ) {
      state.examId = action.payload.examId;
      state.roomCode = action.payload.roomCode ?? null;
      state.status = "joining";
      state.error = null;
    },

    /** Server xác nhận join thành công, chờ teacher bắt đầu */
    examJoined(state) {
      state.status = "waiting";
    },

    /** Teacher bắt đầu → nhận totalTime từ server */
    examStarted(state, action: PayloadAction<{ totalTime: number }>) {
      state.status = "live";
      state.totalTime = action.payload.totalTime;
      state.timeLeft = action.payload.totalTime;
      state.currentQuestionIndex = 0;
      state.answers = {};
    },

    /** Mỗi giây socket emit tick → giảm timeLeft */
    tick(state) {
      if (state.timeLeft > 0) state.timeLeft -= 1;
    },

    /** Đặt thẳng timeLeft (dùng khi nhận từ server để sync) */
    setTimeLeft(state, action: PayloadAction<number>) {
      state.timeLeft = action.payload;
    },

    /** Người dùng chọn đáp án */
    selectAnswer(
      state,
      action: PayloadAction<{ questionId: string; optionId: string }>
    ) {
      state.answers[action.payload.questionId] = action.payload.optionId;
    },

    /** Chuyển sang câu tiếp theo */
    nextQuestion(state) {
      if (
        state.totalQuestions !== null &&
        state.currentQuestionIndex < state.totalQuestions - 1
      ) {
        state.currentQuestionIndex += 1;
      }
    },

    /** Quay lại câu trước */
    prevQuestion(state) {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
      }
    },

    /** Nhảy đến câu bất kỳ (dùng cho question map) */
    goToQuestion(state, action: PayloadAction<number>) {
      state.currentQuestionIndex = action.payload;
    },

    /** Server trả về kết quả sau finish_exam */
    examFinished(
      state,
      action: PayloadAction<{
        score: number;
        totalQuestions: number;
        correctCount: number;
        breakdown: AnswerRecord[];
        leaderboard: LeaderboardEntry[];
      }>
    ) {
      state.status = "finished";
      state.score = action.payload.score;
      state.totalQuestions = action.payload.totalQuestions;
      state.correctCount = action.payload.correctCount;
      state.breakdown = action.payload.breakdown;
      state.leaderboard = action.payload.leaderboard;
    },

    /** Cập nhật leaderboard realtime (server emit trong lúc thi) */
    updateLeaderboard(state, action: PayloadAction<LeaderboardEntry[]>) {
      state.leaderboard = action.payload;
    },

    /** Lỗi socket */
    setExamError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },

    /** Reset toàn bộ về idle (thoát phòng thi) */
    resetExam() {
      return initialState;
    },
  },
});

export const {
  joinExam,
  examJoined,
  examStarted,
  tick,
  setTimeLeft,
  selectAnswer,
  nextQuestion,
  prevQuestion,
  goToQuestion,
  examFinished,
  updateLeaderboard,
  setExamError,
  resetExam,
} = examSlice.actions;

export default examSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectExamStatus = (s: RootState) => s.exam.status;
export const selectTimeLeft = (s: RootState) => s.exam.timeLeft;
export const selectCurrentIndex = (s: RootState) => s.exam.currentQuestionIndex;
export const selectAnswers = (s: RootState) => s.exam.answers;
export const selectLeaderboard = (s: RootState) => s.exam.leaderboard;
export const selectExamResult = (s: RootState) => ({
  score: s.exam.score,
  totalQuestions: s.exam.totalQuestions,
  correctCount: s.exam.correctCount,
  breakdown: s.exam.breakdown,
});
