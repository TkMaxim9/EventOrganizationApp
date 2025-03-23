import React, { useState, useEffect } from 'react';
import { BACKEND_PATH } from '../../constants/constants';
import useUserStore from '../store/UserStore';
import { useNavigate, useParams } from 'react-router-dom';

interface IEvent {
    title: string;
    description: string;
    eventDate: string;
    eventAddress: string;
    vkLink: string;
    tgLink: string;
    imageUrl: string;
}

const EditEvent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<IEvent>({
        title: '',
        description: '',
        eventDate: '',
        eventAddress: '',
        vkLink: '',
        tgLink: '',
        imageUrl: ''
    });
    const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
    const [errors, setErrors] = useState<Partial<Record<keyof IEvent, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const userId = useUserStore((state) => state.userId);
    const navigate = useNavigate();

    // Загрузка данных мероприятия
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await fetch(`${BACKEND_PATH}/event/${id}`);
                
                if (!response.ok) {
                    throw new Error('Не удалось загрузить данные мероприятия');
                }
                
                const eventData = await response.json();
                console.log(eventData.event.creatorUserId)
                // Проверка, является ли текущий пользователь создателем мероприятия
                if (eventData.event.creatorUserId !== userId) {
                    alert('У вас нет прав на редактирование этого мероприятия');
                    navigate('/');
                    return;
                }
                console.log(eventData.event)
                // Форматирование даты для input type="datetime-local"
                const formattedDate = eventData.event.eventDate 
                    ? new Date(eventData.event.eventDate).toISOString().slice(0, 16) 
                    : '';
            
                setEvent({
                    title: eventData.event.title || '',
                    description: eventData.event.description || '',
                    eventDate: formattedDate,
                    eventAddress: eventData.event.eventAddress || '',
                    vkLink: eventData.event.vkLink || '',
                    tgLink: eventData.event.tgLink || '',
                    imageUrl: eventData.event.imageUrl || ''
                });
                
                setOriginalImageUrl(eventData.imageUrl || '');
                setIsLoading(false);
            } catch (error) {
                console.error('Ошибка при загрузке мероприятия:', error);
                alert('Произошла ошибка при загрузке данных мероприятия');
                navigate('/');
            }
        };
        
        if (id) {
            fetchEvent();
        }
    }, [id, userId, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEvent(prev => ({
            ...prev,
            [name]: value
        }));

        // Очистка ошибки при вводе
        if (errors[name as keyof IEvent]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof IEvent, string>> = {};

        if (!event.title.trim()) {
            newErrors.title = 'Название мероприятия обязательно';
        }

        if (!event.description.trim()) {
            newErrors.description = 'Описание мероприятия обязательно';
        }

        if (!event.eventDate.trim()) {
            newErrors.eventDate = 'Дата мероприятия обязательна';
        }

        if (!event.eventAddress.trim()) {
            newErrors.eventAddress = 'Адрес мероприятия обязателен';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        if (!validateForm()) {
            return;
        }
    
        setIsSubmitting(true);
    
        try {
            const creatorUserID = userId;

            if (!creatorUserID) {
                navigate("/login");
                setIsSubmitting(false);
                return;
            }
    
            const eventData = {
                ...event,
                eventDate: new Date(event.eventDate).toISOString(),
                creatorUserID: creatorUserID,
            };
    
            const formData = new FormData();
            formData.append("event", JSON.stringify(eventData));
    
            // Добавляем изображение, только если пользователь выбрал новое
            const fileInput = document.getElementById("image") as HTMLInputElement;
            if (fileInput.files && fileInput.files[0]) {
                formData.append("image", fileInput.files[0]);
            } else if (originalImageUrl) {
                // Если нет нового изображения, но есть оригинальное - сохраняем оригинальное
                formData.append("keepOriginalImage", "true");
            }
    
            const response = await fetch(`${BACKEND_PATH}/profile`, {
                method: "PUT",
                body: formData,
            });
    
            const result = await response.json();
    
            if (!response.ok) {
                throw new Error(result.message || "Ошибка при обновлении мероприятия");
            }
    
            alert("Мероприятие успешно обновлено!");
            navigate(`/event/${id}`);
        } catch (error) {
            console.error("Ошибка при обновлении мероприятия:", error);
            alert("Произошла ошибка при обновлении мероприятия. Пожалуйста, попробуйте снова.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Создаем локальный URL для предпросмотра
            const imageUrl = URL.createObjectURL(file);
            setEvent(prev => ({
                ...prev,
                imageUrl: imageUrl
            }));
        }
    };

    if (isLoading) {
        return <div className="pt-22 p-6 text-center">Загрузка данных мероприятия...</div>;
    }

    return (
        <div className="pt-22 p-6">
            <div className="main p-4 max-w-2xl mx-auto bg-gray-50/15 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6">Редактирование мероприятия</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-1">
                            Название мероприятия *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={event.title}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Введите название мероприятия"
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">
                            Описание мероприятия *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={event.description}
                            onChange={handleChange}
                            rows={4}
                            className={`w-full px-3 py-2 border rounded-md ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Введите описание мероприятия"
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div>
                        <label htmlFor="eventDate" className="block text-sm font-medium text-gray-400 mb-1">
                            Дата мероприятия *
                        </label>
                        <input
                            type="datetime-local"
                            id="eventDate"
                            name="eventDate"
                            value={event.eventDate}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md ${errors.eventDate ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.eventDate && <p className="mt-1 text-sm text-red-500">{errors.eventDate}</p>}
                    </div>

                    <div>
                        <label htmlFor="eventAddress" className="block text-sm font-medium text-gray-400 mb-1">
                            Адрес проведения *
                        </label>
                        <input
                            type="text"
                            id="eventAddress"
                            name="eventAddress"
                            value={event.eventAddress}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md ${errors.eventAddress ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Введите адрес проведения"
                        />
                        {errors.eventAddress && <p className="mt-1 text-sm text-red-500">{errors.eventAddress}</p>}
                    </div>

                    <div>
                        <label htmlFor="vkLink" className="block text-sm font-medium text-gray-400 mb-1">
                            Ссылка VK
                        </label>
                        <input
                            type="url"
                            id="vkLink"
                            name="vkLink"
                            value={event.vkLink}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="https://vk.com/..."
                        />
                    </div>

                    <div>
                        <label htmlFor="tgLink" className="block text-sm font-medium text-gray-400 mb-1">
                            Ссылка Telegram
                        </label>
                        <input
                            type="url"
                            id="tgLink"
                            name="tgLink"
                            value={event.tgLink}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="https://t.me/..."
                        />
                    </div>

                    <div>
                        <label htmlFor="image" className="block text-sm font-medium text-gray-400 mb-1">
                            Изображение мероприятия
                        </label>
                        <input
                            type="file"
                            id="image"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer"
                        />
                        {event.imageUrl && (
                            <div className="mt-2">
                                <img
                                    src={BACKEND_PATH + event.imageUrl}
                                    alt="Превью"
                                    className="h-32 object-cover rounded-md"
                                />
                                <p className="text-sm text-gray-400 mt-1">
                                    {originalImageUrl === event.imageUrl 
                                        ? "Текущее изображение" 
                                        : "Новое изображение (будет загружено при сохранении)"}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate(`/profile`)}
                            className="w-1/2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:bg-blue-400"
                        >
                            {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditEvent;