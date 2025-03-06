import React from "react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
    return (
        <header className="flex items-center justify-between p-4 bg-gray-200 shadow-md rounded-lg relative text-black">
            {/* Контейнер для центрирования заголовка */}
            <div className="flex-1 flex justify-center">
                <h1 className="text-xl font-semibold">Event App</h1>
            </div>
            {/* Кнопка "Войти" справа */}
            <Link to="/login" className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600">
                Войти
            </Link>
        </header>
    );
};

export default Header;
