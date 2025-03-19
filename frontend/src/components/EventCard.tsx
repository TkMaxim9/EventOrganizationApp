import React from "react";
import { Link } from "react-router-dom";

export type EventCardProps = {
    id: number;
    name: string;
    date: string;
    address: string;
    usersCount: number;
};

const EventCard: React.FC<EventCardProps> = ({ id, name, date, address, usersCount }) => {
    return (
        <Link key={id} to={`/event/${id}`} className="transition border p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold">{name}</h3>
            <p className="text-sm text-gray-200">Дата: {date.slice(0, 16).replace("T", " ")}</p>
            <p className="text-sm text-gray-200">Место проведения: {address}</p>
            <p className="text-sm text-gray-200">Зарегестрировано: {usersCount ? usersCount : 0}</p>
        </Link>
    );
};

export default EventCard;