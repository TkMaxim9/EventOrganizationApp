import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useUserStore from "../store/UserStore.ts";
import { BACKEND_PATH } from "../../constants/constants.ts";

const Register: React.FC = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [avatar, setAvatar] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const login = useUserStore((state) => state.login);

    const MAX_LENGTH = 64;
    const   MIN_PASSWORD_LENGTH = 8;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAvatar(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        console.log(firstName.length)

        if (password !== confirmPassword) {
            setError("Пароли не совпадают");
            return;
        }
        

        if (
            firstName.length > MAX_LENGTH ||
            lastName.length > MAX_LENGTH ||
            password.length > MAX_LENGTH
        ) {
            setError("Все текстовые поля должны содержать не более 64 символов");
            return;
        }

        if (
            password.length < MIN_PASSWORD_LENGTH
        ) {
            setError("Минимальная длина пароля - 8 символов");
            return;
        }

        setLoading(true);
        
        const formData = new FormData();

        // Создаем объект пользователя
        const user = {
            firstName,
            lastName,
            email,
            password
        };
        
        // Добавляем объект user в FormData как строку (JSON)
        formData.append("user", JSON.stringify(user));

        if (avatar) {
            formData.append("image", avatar);
        }

        try {
            const response = await fetch(BACKEND_PATH + "/register", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Ошибка при регистрации");
            }

            login(data.userId, data.token);
            navigate("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Произошла ошибка при регистрации");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pt-22 main min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full space-y-8">
        <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white-900">
                Регистрация нового аккаунта
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
                    <label htmlFor="firstName" className="sr-only">
                        Имя
                    </label>
                    <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-white rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Имя"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="lastName" className="sr-only">
                        Фамилия
                    </label>
                    <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Фамилия"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>
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
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                        autoComplete="new-password"
                        required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="sr-only">
                        Подтвердите пароль
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Подтвердите пароль"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="profilePicture" className="sr-only">
                        Фото профиля
                    </label>
                    <div className="flex items-center px-3 py-2 border border-gray-300 text-white rounded-b-md focus-within:ring-blue-500 focus-within:border-blue-500 sm:text-sm">
                        <input
                            id="profilePicture"
                            name="profilePicture"
                            type="file"
                            accept="image/*"
                            className="w-full text-white focus:outline-none"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>
            </div>
            
            <div>
                <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                    {loading ? "Регистрация..." : "Зарегистрироваться"}
                </button>
            </div>
            
            <div className="flex items-center justify-center">
                <div className="text-sm">
                    <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                        Уже есть аккаунт? Войдите
                    </Link>
                </div>
            </div>
        </form>
    </div>
</div>
    );
};

export default Register;
