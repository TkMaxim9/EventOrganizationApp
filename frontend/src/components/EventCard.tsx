import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BACKEND_PATH } from "../../constants/constants";

export type EventCardProps = {
    id: number;
    name: string;
    date: string;
    address: string;
    usersCount: number;
    isOwner: boolean;
    fetchFunc?: () => void;
};

const EventCard: React.FC<EventCardProps> = ({ 
    id, 
    name, 
    date, 
    address, 
    usersCount, 
    isOwner, 
    fetchFunc,
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate(`/edit-event/${id}`);
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();

        const isConfirmed = window.confirm("Вы уверены, что хотите удалить это мероприятие?");
        if (!isConfirmed) return;
        
        try {
            setIsDeleting(true);

            const response = await fetch(BACKEND_PATH + "/event/" + id, {
                method: "DELETE",
            });
    
            const result = await response.json();
    
            if (!response.ok) {
                throw new Error(result.message || "Ошибка при удалении мероприятия");
            }

            if (fetchFunc) {
                fetchFunc();
            }
        } catch (error) {
            console.error("Ошибка при удалении события:", error);
            alert("Не удалось удалить событие. Пожалуйста, попробуйте снова.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // Если клик был по кнопкам или их контейнеру, не переходим по ссылке
        if (
            (e.target as HTMLElement).tagName === "BUTTON" ||
            (e.target as HTMLElement).closest(".action-buttons")
        ) {
            e.preventDefault();
        }
    };

    return (
        <Link 
            key={id} 
            to={`/event/${id}`} 
            className="transition border p-4 rounded-lg shadow-md block hover:bg-gray-800"
            onClick={handleCardClick}
        >
            <h3 className="text-lg font-bold">{name}</h3>
            <p className="text-sm text-gray-200">Дата: {date.slice(0, 16).replace("T", " ")}</p>
            <p className="text-sm text-gray-200">Место проведения: {address}</p>
            <p className="text-sm text-gray-200">Зарегистрировано: {usersCount ? usersCount : 0}</p>
            {isOwner && (
                <div className="mt-4 action-buttons">
                    <button 
                        className="mr-2 px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition"
                        onClick={handleEdit}
                    >
                        Ред.
                    </button>
                    <button 
                        className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 transition"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Удаление..." : "Удалить"}
                    </button>
                </div>
            )}
        </Link>
    );
};

export default EventCard;