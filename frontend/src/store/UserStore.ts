import { create } from "zustand";

interface IUser {
    id: number;
    name: string;
    email: string;
}

interface StoreState {
    token: string | null;
    user: IUser | null;
    login: (user: IUser, token: string) => void;
    logout: () => void;
}

const useUserStore = create<StoreState>((set) => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    return {
        token: storedToken || null,
        user: storedUser ? JSON.parse(storedUser) : null,
        login: (user, token) => {
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            set({ user, token });
        },
        logout: () => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            set({ user: null, token: null });
        },
    };
});

export default useUserStore;
