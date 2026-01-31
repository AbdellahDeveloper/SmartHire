import axios from "axios";
import { authStorage } from "../lib/auth-context.js";

export const createServiceClient = (baseURL: string, timeout = 10000) => {
    const instance = axios.create({
        baseURL,
        timeout,
        headers: {
            "Content-Type": "application/json",
        },
    });

    instance.interceptors.request.use((config) => {
        const store = authStorage.getStore();
        if (store?.token) {
            config.headers.Authorization = `Bearer ${store.token}`;
        }
        return config;
    });

    return instance;
};

export const handleServiceError = (error: any) => {
    if (error.response) {
        return {
            content: [
                {
                    type: "text",
                    text: `Service Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
                },
            ],
            isError: true,
        };
    }
    return {
        content: [
            {
                type: "text",
                text: `Network Error: ${error.message}`,
            },
        ],
        isError: true,
    };
};
