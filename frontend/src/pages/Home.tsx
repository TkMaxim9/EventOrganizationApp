import React, { useEffect, useState } from "react";
import EventCard, {EventCardProps} from "../components/EventCard";
import {BACKEND_PATH} from "../../constants/constants.ts";


const Home: React.FC = () => {
    const [events, setEvents] = useState<EventCardProps[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [dateFilter, setDateFilter] = useState<string>("");
    const [addressFilter, setAddressFilter] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const fetchEvents = () => {
        setLoading(true);

        // Построение URL с query параметрами
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append("search", searchTerm);
        if (dateFilter) queryParams.append("date", dateFilter);
        if (addressFilter) queryParams.append("address", addressFilter);

        const url = `${BACKEND_PATH}/api/events${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

        fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Не удалось загрузить мероприятия");
                }
                return response.json();
            })
            .then((data) => setEvents(data))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchEvents();
    }, []); // Загрузка при первом рендере

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchEvents();
    };

    const clearFilters = () => {
        setSearchTerm("");
        setDateFilter("");
        setAddressFilter("");
        // После очистки сразу загружаем все события
        setTimeout(fetchEvents, 0);
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Список мероприятий</h2>

            {/* Форма поиска и фильтрации */}
            <form onSubmit={handleSearch} className="mb-6 p-4 bg-gray-50 rounded-lg">
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

                    <div className="flex items-end gap-2">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            disabled={loading}
                        >
                            {loading ? "Загрузка..." : "Найти"}
                        </button>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            disabled={loading}
                        >
                            Сбросить
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
                <div className="text-center py-4">
                    Мероприятия не найдены
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((event) => (
                        <EventCard key={event.id} {...event} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Home;
