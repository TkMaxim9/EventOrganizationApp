import { create } from "zustand";

interface StoreState {
    token: string | null;
    userId: number | null;
    login: (userId: number, token: string) => void;
    logout: () => void;
}

const useUserStore = create<StoreState>((set) => {
    const storedToken = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");

    return {
        token: storedToken || null,
        userId: storedUserId ? Number(storedUserId) : null,
        login: (userId, token) => {
            localStorage.setItem("token", token);
            localStorage.setItem("userId", userId.toString());
            set({ userId, token });
        },
        logout: () => {
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            set({ userId: null, token: null });
        },
    };
});

export default useUserStore;
