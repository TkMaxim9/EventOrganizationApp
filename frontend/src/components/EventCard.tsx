import React from "react";
import { Link } from "react-router-dom";

export type EventCardProps = {
    id: number;
    name: string;
    date: string;
    address: string;
};

const EventCard: React.FC<EventCardProps> = ({ id, name, date, address }) => {
    return (
        <Link key={id} to={`/event/${id}`} className="transition border p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold">{name}</h3>
            <p className="text-sm text-gray-200">Дата: {date}</p>
            <p className="text-sm text-gray-200">Место проведения: {address}</p>
        </Link>
    );
};

export default EventCard;