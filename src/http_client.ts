import { validateAuth, ValidateAuthError } from "./auth";
import { API_BASE_URL, dynamicConfig, SERVER_BASE_PATH } from "./config";

export interface HTTPClientParams {
    baseUrl: string;
}

export interface CallParams {
    path: string;
    pathParams?: Record<string, string>;
    query?: Record<string, string>;
    method?: RequestInit['method'];
    headers?: Record<string, string>;
    body?: RequestInit['body'];
    authorizationHeader?: string;
}

export class HTTPClient {
    private baseUrl: string;

    constructor(params: HTTPClientParams) {
        this.baseUrl = params.baseUrl;
    }

    public async call(params: CallParams): Promise<Response> {
        const validateAuthResult = await validateAuth(params);

        if (validateAuthResult === ValidateAuthError.LoginRequired) {
            const redirectUrl = dynamicConfig().MCP_SERVER_BASE_URL + SERVER_BASE_PATH + "/signup";
            const body = `<p>Login required. Please visit <a href="${redirectUrl}">${redirectUrl}</a> to sign up.</p>`;
            return new Response(body, {
                status: 401,
                headers: {
                    "Content-Type": "text/html",
                },
            });
        }

        let path = params.path;
        for (const [key, value] of Object.entries(params.pathParams ?? {})) {
            path = path.replace(`{${key}}`, value);
        }
        console.assert(!path.includes('{'), `Not all path params were replaced in path: ${path}`);

        return fetch(`${this.baseUrl}${path}?${new URLSearchParams(params.query).toString()}`, {
            method: params.method,
            headers: params.headers,
            body: params.body,
        });
    }
}

export const httpClient = new HTTPClient({
    baseUrl: API_BASE_URL,
});
