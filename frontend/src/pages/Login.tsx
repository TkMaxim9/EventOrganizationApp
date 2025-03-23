import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import useUserStore from "../store/UserStore";
import {AUTH_PATH, BACKEND_PATH} from "../../constants/constants.ts";


const Login: React.FC = () => {
    const location = useLocation(); // Импортируйте useLocation из react-router-dom
    
    // Получаем параметр redirect из URL
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get('redirect') || '/';
    console.log(redirectPath)

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const login = useUserStore((state) => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
    
        try {
            const response = await fetch(AUTH_PATH + "/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });
    
            const contentType = response.headers.get("Content-Type");
            let data;
    
            if (contentType?.includes("application/json")) {
                data = await response.json();
            } else {
                data = await response.text(); // Если сервер вернул текст
                throw new Error(data || "Ошибка при входе в систему");
            }
    
            if (!response.ok) {
                throw new Error(data.message || "Ошибка при входе в систему");
            }
    
            login(data.user.id, data.token);

            navigate(redirectPath);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Произошла ошибка при входе в систему");
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div className="pt-22 main min-h-screen flex items-center justify-center  py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white-900">
                        Вход в аккаунт
                    </h2>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-white rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Пароль
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-white rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Пароль"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                        >
                            {loading ? "Выполняется вход..." : "Войти"}
                        </button>
                    </div>

                    <div className="flex items-center justify-center">
                        <div className="text-sm">
                            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                                Нет аккаунта? Зарегистрируйтесь
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;