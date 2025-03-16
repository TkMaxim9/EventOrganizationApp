import React, { useEffect, useState } from "react";
import EventCard, { EventCardProps } from "../components/EventCard";
import { BACKEND_PATH } from "../../constants/constants.ts";
import useUserStore from "../store/UserStore.ts";
import { IEvent } from "./EventPage"
import { redirect, useNavigate } from "react-router-dom";

interface IUserInfo {
    firstName: string;
    lastName: string;
    email: string;
}

interface IProfile {
    userInfo: IUserInfo;
    events: IEvent[];
}

const Profile: React.FC = () => {
    const { userId } = useUserStore();
    const [profileData, setProfileData] = useState<IProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const logout = useUserStore((state) => state.logout);
    const navigate = useNavigate();

    const fetchProfile = () => {
        setLoading(true);

        const url = `${BACKEND_PATH}/profile/${userId ? userId : null}`;

        fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Не удалось загрузить профиль");
                }
                return response.json();
            })
            .then((data) => setProfileData(data.profileInfo))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchProfile();
    }, []); // Загрузка при первом рендере

    const handleSubmit = () => {
        logout();
        navigate("/");
    }

    return (
        <div className="p-4 pt-22 overflow-hidden main ">
            {loading ? (
                <div className="flex justify-center items-center h-64 bg-gray-50/15 rounded-lg">
                    <p className="text-lg">Загрузка...</p>
                </div>
            ) : profileData ? (
                <div className="max-w-4xl mx-auto bg-gray-50/15 rounded-lg p-4">
                    {/* Блок с информацией о пользователе */}
                    <div className="bg-white p-6 rounded-lg shadow-md mb-6 text-gray-700">
                        <h2 className="text-2xl font-bold mb-4">Профиль пользователя</h2>
                        <div className="space-y-2">
                            <p className="text-lg">
                                <span className="font-semibold">Имя:</span> {profileData.userInfo.firstName} {profileData.userInfo.lastName}
                            </p>
                            <p className="text-lg">
                                <span className="font-semibold">Email:</span> {profileData.userInfo.email}
                            </p>
                            <button className="!text-white" onClick={() => handleSubmit()}>
                                Выйти
                            </button>
                        </div>
                    </div>

                    {/* Блок с событиями пользователя */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold mb-4">Мои события</h2>
                        {profileData.events && profileData.events.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {profileData.events.map((event) => (
                                    <EventCard
                                        key={event.eventId}
                                        id={event.eventId}
                                        name={event.title}
                                        date={event.eventDate}
                                        address={event.eventAddress}
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