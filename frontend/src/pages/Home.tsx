import React, { useEffect, useState } from "react";
import EventCard, {EventCardProps} from "../components/EventCard";
import {BACKEND_PATH} from "../../constants/constants.ts";
import {Link} from "react-router-dom";
import useUserStore from "../store/UserStore.ts";


const Home: React.FC = () => {
    const [events, setEvents] = useState<EventCardProps[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [dateFilter, setDateFilter] = useState<string>("");
    const [addressFilter, setAddressFilter] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const userId = useUserStore((state) => state.userId);

    const fetchEvents = (params : URLSearchParams) => {
        setLoading(true);
    
        const url = `${BACKEND_PATH}/events${params.toString() ? `?${params.toString()}` : ""}`;

        fetch(url)
    .then((response) => {
        if (!response.ok) {
            throw new Error("Не удалось загрузить мероприятия");
        }
        return response.json();
    })
    .then((data) => {
        if (data.eventCards && data.eventCards.length > 0) {
            setEvents(data.eventCards);
        }
        else{
            setEvents([])
        }
    })
    .catch(e => console.error(e))
    .finally(() => setLoading(false));
    };

    useEffect(() => {
        console.log("hello");
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append("search", searchTerm);
        if (dateFilter) queryParams.append("date", dateFilter);
        if (addressFilter) queryParams.append("address", addressFilter);
        fetchEvents(queryParams);
    }, []); 

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append("search", searchTerm);
        if (dateFilter) queryParams.append("date", dateFilter);
        if (addressFilter) queryParams.append("address", addressFilter);
        fetchEvents(queryParams);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setDateFilter("");
        setAddressFilter("");
        const queryParams = new URLSearchParams();
        // После очистки сразу загружаем все события
        fetchEvents(queryParams);
    };

    return (
        <div className="p-4 pt-22 overflow-hidden main">
            <h2 className="text-2xl font-bold mb-4">Список мероприятий</h2>

            <button className="w-full mb-4 hover:text-white">
                <Link to={userId ? "/create-event" : "/login"} className="no-blue-hover">
                    + Создать мерприятие
                </Link>
            </button>

            {/* Форма поиска и фильтрации */}
            <form onSubmit={handleSearch} className="mb-6 p-4 bg-gray-50/15 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="search" className="block mb-1 text-sm font-medium">
                            Поиск по названию
                        </label>
                        <input
                            type="text"
                            id="search"
                            className="w-full p-2 border rounded"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Введите название мероприятия"
                        />
                    </div>

                    <div>
                        <label htmlFor="date" className="block mb-1 text-sm font-medium">
                            Фильтр по дате
                        </label>
                        <input
                            type="date"
                            id="date"
                            className="w-full p-2 border rounded"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="address" className="block mb-1 text-sm font-medium">
                            Фильтр по адресу
                        </label>
                        <input
                            type="text"
                            id="address"
                            className="w-full p-2 border rounded"
                            value={addressFilter}
                            onChange={(e) => setAddressFilter(e.target.value)}
                            placeholder="Введите адрес"
                        />
                    </div>

                    <div className="flex items-end gap-2 w-full">
                        <button
                            type="submit"
                            className="!text-xs !h-full flex-1 min-w-0 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 overflow-hidden text-ellipsis whitespace-nowrap"
                            disabled={loading}
                        >
                            {loading ? "Загрузка..." : "Найти"}
                        </button>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="!text-xs !h-full flex-1 px-4 py-2 bg-gray-300 text-gray-400 rounded hover:bg-gray-400 overflow-hidden text-ellipsis whitespace-nowrap"
                            disabled={loading}
                        >
                            Сброс
                        </button>
                    </div>
                </div>
            </form>

            {/* Индикатор загрузки */}
            {loading && (
                <div className="text-center py-4">
                    Загрузка мероприятий...
                </div>
            )}

            {/* Список мероприятий */}
            {!loading && events.length === 0 ? (
                <div className="text-center py-4 bg-gray-50/15 rounded-lg">
                    Мероприятия не найдены
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50/15 rounded-lg p-10">
                    {events.map((event) => (
                        <EventCard key={event.id} {...event} isOwner = {false} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Home;
