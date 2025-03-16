import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useUserStore from "../store/UserStore.ts";
import {BACKEND_PATH} from "../../constants/constants.ts";

export interface IEvent {
    eventId: number;
    title: string;
    description: string;
    eventDate: string;
    eventAddress: string;
    vkLink: string;
    tgLink: string;
    imageUrl: string;
}

const EventPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<IEvent | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useUserStore();
    const navigate = useNavigate();
    const userId = useUserStore((state) => state.userId);

    useEffect(() => {
        console.log("hello lit")
        const fetchEvent = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${BACKEND_PATH}/event/${id}`);

                if (!response.ok) {
                    throw new Error('Не удалось загрузить информацию о мероприятии');
                }

                const data = await response.json();
                console.log(data.event)
                setEvent(data.event);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке мероприятия');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id]);

    // Проверка авторизации перед регистрацией на мероприятие
    const handleRegisterForEvent = async () => {
        if (!token) {
            // Если пользователь не авторизован, перенаправляем на страницу входа
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_PATH}/participate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    eventId: Number(id), 
                    userId: userId ? userId : 1
                })
            });

            if (!response.ok) {
                throw new Error('Не удалось зарегистрироваться на мероприятие');
            }

            alert('Вы успешно зарегистрировались на мероприятие!');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Произошла ошибка при регистрации на мероприятие');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="p-24 flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="sr-only">Загрузка...</span>
                    </div>
                    <p className="mt-2">Загрузка информации о мероприятии...</p>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="p-24 container mx-auto px-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Ошибка! </strong>
                    <span className="block sm:inline">{error || 'Мероприятие не найдено'}</span>
                </div>
                <Link to="/" className="text-blue-500 hover:underline">← Вернуться к списку мероприятий</Link>
            </div>
        );
    }

    return (
        <div className="p-24 container mx-auto px-4">
            <div className="bg-gray-50/15 rounded-lg shadow-lg overflow-hidden">
                {/* Изображение мероприятия */}
                {event.imageUrl ? (
                <div className="relative h-64 md:h-96">
                    <img
                        src={BACKEND_PATH + event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : null}

                {/* Информация о мероприятии */}
                <div className="p-6">
                    <div className="flex justify-between items-start flex-wrap">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-100 mb-2">{event.title}</h1>
                            <div className="flex flex-wrap items-center text-gray-100 mb-4">
                                <div className="mr-6 mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {formatDate(event.eventDate)}
                                </div>
                                <div className="mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {event.eventAddress}
                                </div>
                            </div>
                        </div>

                        {/* Социальные сети */}
                        <div className="flex space-x-3">
                            {event.vkLink && (
                                <a
                                    href={event.vkLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 16.711h-1.616c-.607 0-.793-.583-1.888-1.681-1.08-1.022-1.565-1.166-1.832-1.166-.376 0-.482.107-.482.623v1.519c0 .44-.141.705-1.3.705-1.931 0-4.062-1.17-5.578-3.358-2.245-3.264-2.871-5.693-2.871-6.203 0-.265.106-.517.624-.517h1.616c.465 0 .677.212.87.715.928 2.69 2.511 5.058 3.149 5.058.241 0 .353-.111.353-.722V8.637c-.071-1.299-.741-1.405-.741-1.87 0-.223.188-.447.488-.447h2.544c.353 0 .471.176.471.611v3.307c0 .353.153.482.247.482.212 0 .376-.129.753-.506 1.166-1.299 2.004-3.303 2.004-3.303.112-.247.377-.47.753-.47h1.616c.482 0 .589.247.482.576-.188.888-2.116 3.634-2.116 3.634-.164.272-.223.397 0 .704.153.22.659.682 1.007 1.088.611.765 1.084 1.408 1.204 1.845.143.434-.13.654-.566.654z"/>
                                    </svg>
                                </a>
                            )}
                            {event.tgLink && (
                                <a
                                    href={event.tgLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.269c-.145.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.55-5.023c.242-.213-.054-.334-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.658-.643.136-.953l11.59-4.448c.538-.196 1.006.128.823.941z" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Описание */}
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-3">Описание</h2>
                        <div className="prose max-w-none">
                            {event.description.split('\n').map((paragraph, idx) => (
                                <p key={idx} className="mb-4">{paragraph}</p>
                            ))}
                        </div>
                    </div>

                    {/* Кнопка регистрации */}
                    <div className="mt-8">
                        <button
                            onClick={handleRegisterForEvent}
                            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-200"
                        >
                            {token ? 'Зарегистрироваться на мероприятие' : 'Войдите, чтобы зарегистрироваться'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Навигация */}
            <div className="mt-8">
                <Link to="/" className="text-blue-500 hover:underline">← Вернуться к списку мероприятий</Link>
            </div>
        </div>
    );
};

export default EventPage;
