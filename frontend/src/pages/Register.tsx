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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAvatar(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Пароли не совпадают");
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
                throw new Error(data.message || "Ошибка при регистрации");
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
        <div className="pt-22 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    Регистрация нового аккаунта
                </h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <input type="text" placeholder="Имя" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    <input type="text" placeholder="Фамилия" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <input type="password" placeholder="Подтвердите пароль" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                    
                    <button type="submit" disabled={loading}>
                        {loading ? "Регистрация..." : "Зарегистрироваться"}
                    </button>
                </form>
                <Link to="/login">Уже есть аккаунт? Войдите</Link>
            </div>
        </div>
    );
};

export default Register;
