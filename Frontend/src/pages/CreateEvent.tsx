import React, { useState } from 'react';

interface IEvent {
    name: string;
    description: string;
    date: string;
    address: string;
    linkVK: string;
    linkTG: string;
    imageSrc: string;
}

const CreateEvent: React.FC = () => {
    const [event, setEvent] = useState<IEvent>({
        name: '',
        description: '',
        date: '',
        address: '',
        linkVK: '',
        linkTG: '',
        imageSrc: ''
    });

    const [errors, setErrors] = useState<Partial<Record<keyof IEvent, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        if (!event.name.trim()) {
            newErrors.name = 'Название мероприятия обязательно';
        }

        if (!event.description.trim()) {
            newErrors.description = 'Описание мероприятия обязательно';
        }

        if (!event.date.trim()) {
            newErrors.date = 'Дата мероприятия обязательна';
        }

        if (!event.address.trim()) {
            newErrors.address = 'Адрес мероприятия обязателен';
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
            // Здесь будет логика отправки данных на сервер
            console.log('Отправка данных мероприятия:', event);

            // Имитация задержки API
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Сброс формы после успешной отправки
            setEvent({
                name: '',
                description: '',
                date: '',
                address: '',
                linkVK: '',
                linkTG: '',
                imageSrc: ''
            });

            alert('Мероприятие успешно создано!');
        } catch (error) {
            console.error('Ошибка при создании мероприятия:', error);
            alert('Произошла ошибка при создании мероприятия. Пожалуйста, попробуйте снова.');
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
                imageSrc: imageUrl
            }));
        }
    };

    return (
        <div className="pt-22 p-6">
            <div className="main p-4 max-w-2xl mx-auto bg-gray-50/15 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6">Создание нового мероприятия</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                            Название мероприятия *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={event.name}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Введите название мероприятия"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
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
                            id="date"
                            name="date"
                            value={event.date}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md ${errors.date ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
                    </div>

                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-400 mb-1">
                            Адрес проведения *
                        </label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            value={event.address}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Введите адрес проведения"
                        />
                        {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
                    </div>

                    <div>
                        <label htmlFor="linkVK" className="block text-sm font-medium text-gray-400 mb-1">
                            Ссылка VK
                        </label>
                        <input
                            type="url"
                            id="linkVK"
                            name="linkVK"
                            value={event.linkVK}
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
                            id="linkTG"
                            name="linkTG"
                            value={event.linkTG}
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
                        {event.imageSrc && (
                            <div className="mt-2">
                                <img
                                    src={event.imageSrc}
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