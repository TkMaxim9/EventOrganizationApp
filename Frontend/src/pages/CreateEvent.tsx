import React, { useState } from 'react';
import { BACKEND_PATH } from '../../constants/constants';
import useUserStore from '../store/UserStore';
import { useNavigate } from 'react-router-dom';

interface IEvent {
    title: string;
    description: string;
    eventDate: string;
    eventAddress: string;
    vkLink: string;
    tgLink: string;
    imageUrl: string;
}

const CreateEvent: React.FC = () => {
    const [event, setEvent] = useState<IEvent>({
        title: '',
        description: '',
        eventDate: '',
        eventAddress: '',
        vkLink: '',
        tgLink: '',
        imageUrl: ''
    });

    const [errors, setErrors] = useState<Partial<Record<keyof IEvent, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const userId = useUserStore((state) => state.userId);
    const navigate = useNavigate();

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
        if (event.title.trim().length > 64) {
            newErrors.title = 'Максимум 64 символов';
        }

        if (!event.description.trim()) {
            newErrors.description = 'Описание мероприятия обязательно';
        }

        if (!event.eventDate.trim()) {
            newErrors.eventDate = 'Дата мероприятия обязательна';
        } else {
            // Проверка, что дата мероприятия не в прошлом
            const eventDateTime = new Date(event.eventDate);
            const currentDateTime = new Date();
            
            if (eventDateTime <= currentDateTime) {
                newErrors.eventDate = 'Дата и время мероприятия должны быть в будущем';
            }
        }

        if (!event.eventAddress.trim()) {
            newErrors.eventAddress = 'Адрес мероприятия обязателен';
        }
        if (event.eventAddress.trim().length > 64) {
            newErrors.eventAddress = 'Максимум 64 символа';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
    
        if (!validateForm()) {
            return;
        }
    
        setIsSubmitting(true);
    
        try {
            const creatorUserID = userId;

            if (!creatorUserID) {
                navigate("/login", { 
                    state: { redirectUrl: window.location.pathname } 
                });
                setIsSubmitting(false);
                return;
            }
    
            const eventData = {
                ...event,
                eventDate: new Date(event.eventDate).toISOString(),
                creatorUserID: creatorUserID, // Добавляем ID из хранилища
            };
    
            const formData = new FormData();
            formData.append("event", JSON.stringify(eventData));
    
            console.log("here")
            if (event.imageUrl && document.getElementById("image") instanceof HTMLInputElement) {
                const fileInput = document.getElementById("image") as HTMLInputElement;
                console.log("here")
                console.log(fileInput.files?.length)
                if (fileInput.files && fileInput.files[0]) {
                    formData.append("image", fileInput.files[0]);
                }
            }
    
            const response = await fetch(BACKEND_PATH + "/event", {
                method: "POST",
                body: formData,
            });
    
            const result = await response.json();
    
            if (!response.ok) {
                throw new Error(result.error || "Ошибка при создании мероприятия");
            }
    
            setEvent({
                title: "",
                description: "",
                eventDate: "",
                eventAddress: "",
                vkLink: "",
                tgLink: "",
                imageUrl: "",
            });
    
            alert("Мероприятие успешно создано!");
            navigate("/");
        } catch (err) {
            console.error("Ошибка при создании мероприятия:", err);
            //alert("Произошла ошибка при создании мероприятия. Пожалуйста, попробуйте снова.");
            setError(err instanceof Error ? err.message : "Произошла ошибка при входе в систему");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // В реальном приложении здесь должна быть загрузка изображения на сервер
            // Для примера используем локальный URL
            const imageUrl = URL.createObjectURL(file);
            setEvent(prev => ({
                ...prev,
                imageUrl: imageUrl
            }));
        }
    };

    return (
        <div className="pt-22 p-6">
            <div className="main p-4 max-w-2xl mx-auto bg-gray-50/15 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6">Создание нового мероприятия</h2>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
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
                        <label htmlFor="date" className="block text-sm font-medium text-gray-400 mb-1">
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
                        <label htmlFor="address" className="block text-sm font-medium text-gray-400 mb-1">
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
                        <label htmlFor="linkVK" className="block text-sm font-medium text-gray-400 mb-1">
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
                        <label htmlFor="linkTG" className="block text-sm font-medium text-gray-400 mb-1">
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
                                    src={event.imageUrl}
                                    alt="Превью"
                                    className="h-32 object-cover rounded-md"
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:bg-blue-400"
                        >
                            {isSubmitting ? 'Создание...' : 'Создать мероприятие'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEvent;