import React from "react";
import { Link } from "react-router-dom";
import useUserStore from "../store/UserStore.ts";

const Header: React.FC = () => {
    const { userId } = useUserStore();

    return (

        <header className="fixed top-0 left-0 w-full z-50 p-3 shadow-md text-white">
            <div className="main flex items-center justify-between">
                <div className="flex-1 flex justify-center">
                    <Link to="/">
                        <h1 className="text-xl font-extrabold text-white">Event App</h1>
                    </Link>
                </div>
                {userId ? (
                    <Link to="/profile" className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md">
                        Профиль
                    </Link>
                ) : (
                    <Link to="/login" className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md">
                    Войти
                    </Link>
                )}

            </div>
        </header>
    );
};

export default Header;
