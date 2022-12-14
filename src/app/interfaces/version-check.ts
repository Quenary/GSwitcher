export interface IVersionCheckResponse {
    name: string,
    tag: {
        name: string
    },
    isPrerelease: boolean;
    publishedAt: string;
    url: string;
}