declare namespace Api {
    export interface Company {
        id: number;
        companyName: string;
        companyStatus?: string | null;
        dormant: boolean;
        industry: string;
        size: number;
        status: string;
        color: string;
        logo?: string | null;
        dealStatus: string;
        pipelineStage: string;
        createdAt: string; // date-time
        updatedAt: string; // date-time
    }
    export interface CompanyFilter {
        status: string;
    }
    export interface CompanyNew {
        companyName: string;
        companyStatus?: string | null;
        dormant: boolean;
        industry: string;
        size: number;
        status: string;
        color: string;
        logo?: string | null;
        dealStatus: string;
        pipelineStage: string;
    }
    export interface CompanyUpdate {
        companyName?: string | null;
        companyStatus?: string | null;
        dormant?: boolean | null;
        industry?: string | null;
        size?: null | number;
        status?: string | null;
        color?: string | null;
        logo?: string | null;
        dealStatus?: string | null;
        pipelineStage?: string | null;
    }
    export interface Conversation {
        id: number;
        name: string;
        externalId: string;
        companyId?: null | number;
        userId?: null | number;
        facebookId?: string | null;
        slackId?: string | null;
        slackTeamId?: string | null;
        coverUrl?: string | null;
        isAnswered: boolean;
        firstUnansweredMessageAt?: string | null; // date-time
        lastMessageAt?: string | null; // date-time
        createdAt: string; // date-time
        updatedAt: string; // date-time
    }
    export interface Role {
        id: number;
        name: string;
        type?: string | null;
        status: string;
        permissions: string[];
        companyId?: null | number;
        channelIds?: number[] | null;
        createdAt: string; // date-time
        updatedAt: string; // date-time
    }
    export interface RoleNew {
        name: string;
        type?: string | null;
        permissions: string[];
    }
    export interface RoleUpdate {
        name?: string | null;
        type?: string | null;
        permissions?: string[] | null;
        companyId?: null | number;
        channelIds?: number[] | null;
    }
    export interface UserClientSelf {
        id: number;
        role: number;
        sendBirdId: string;
        safeData: UserSafeData;
        email?: string | null;
        phoneNumber?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        idName?: string | null;
        avatar?: string | null;
        card?: string | null;
        nric?: string | null;
        nationality?: string | null;
        nickname?: string | null;
        documentNumber?: string | null;
        documentType?: string | null;
        birthdate?: string | null; // date-time
        sex?: string | null;
        residentialAddress?: null | number;
        companiesOrder?: string | null;
    }
    export interface UserSafeData {
        sendBirdAccessToken: string;
    }
    export interface Widget {
        id: number;
        name: string;
        type: string;
        widgetCategoryId: number;
    }
    export interface WidgetNew {
        name: string;
        type: string;
        widgetCategoryId: number;
    }
    export interface WidgetUpdate {
        name?: string | null;
        type?: string | null;
        widgetCategoryId?: null | number;
    }
}
