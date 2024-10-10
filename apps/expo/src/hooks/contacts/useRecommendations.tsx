import { useEffect, useCallback } from "react";
import * as Contacts from "expo-contacts";
import type { Contact } from "expo-contacts";
import { PermissionStatus } from "expo-contacts";

import * as Crypto from "expo-crypto";
import { parsePhoneNumber } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

import { api } from "~/utils/api";

export interface RecommendationType {
    tier1: string[];
    tier2: string[];
    tier3: string[];
    tier4: string[];
}

export interface RecomendationFns {
    getRecomendations: () => Promise<RecommendationType>;
}

const useRecommendations = (): RecomendationFns => {
    const getRecomendations = () => {
        const thing: RecommendationType = {
            tier1: [],
            tier2: [],
            tier3: [],
            tier4: [],
        };

        return Promise.resolve(thing);
    };

    return {
        getRecomendations,
    };
};

export default useRecommendations;

