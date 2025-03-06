import React, { useEffect, useState } from "react";
import EventCard, { EventCardProps } from "../components/EventCard";
import { BACKEND_PATH } from "../../constants/constants.ts";
import useUserStore from "../store/UserStore.ts";

interface IUserInfo {
    firstName: string;
    lastName: string;
    email: string;
}

interface IProfile {
    user: IUserInfo;
    events: EventCardProps[];
}

const Profile: React.FC = () => {
    const { user } = useUserStore();
    const [profileData, setProfileData] = useState<IProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchProfile = () => {
        setLoading(true);

        const url = `${BACKEND_PATH}/api/profile/${user ? user.id : null}`;

        fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Не удалось загрузить профиль");
                }
                return response.json();
            })
            .then((data) => setProfileData(data))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchProfile();
    }, []); // Загрузка при первом рендере

    return (
        <div className="p-4 pt-22 overflow-hidden main ">
            {loading ? (
                <div className="flex justify-center items-center h-64 bg-gray-50/15 rounded-lg">
                    <p className="text-lg">Загрузка...</p>
                </div>
            ) : profileData ? (
                <div className="max-w-4xl mx-auto bg-gray-50/15 rounded-lg">
                    {/* Блок с информацией о пользователе */}
                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h2 className="text-2xl font-bold mb-4">Профиль пользователя</h2>
                        <div className="space-y-2">
                            <p className="text-lg">
                                <span className="font-semibold">Имя:</span> {profileData.user.firstName} {profileData.user.lastName}
                            </p>
                            <p className="text-lg">
                                <span className="font-semibold">Email:</span> {profileData.user.email}
                            </p>
                        </div>
                    </div>

                    {/* Блок с событиями пользователя */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold mb-4">Мои события</h2>
                        {profileData.events.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {profileData.events.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        id={event.id}
                                        name={event.name}
                                        date={event.date}
                                        address={event.address}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">У вас пока нет событий</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex justify-center items-center h-64 bg-gray-50/15 rounded-lg">
                    <p className="text-lg">Не удалось загрузить данные профиля</p>
                </div>
            )}
        </div>
    );
};

export default Profile;